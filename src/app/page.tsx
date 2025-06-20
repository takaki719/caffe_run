"use client";
import { saveSchedules, clearSchedules } from "@/lib/local-db";
import React, { useState, useEffect, useCallback, useRef } from "react";
import SettingModal from "../components/SettingModal";
import BlueButton from "../components/BlueButton";
import UnityModelWrapper from "@/components/UnityModelWrapper";
import TopBackButton from "@/components/TopBackButton";
import Chart from "@/components/Chart";
import RecommendedPlanList from "../components/NextCaffeineTime";
import CaffeineLogForm from "../components/CaffeineLogForm";
import SleepForm from "../components/SleepForm";
import FocusForm from "../components/FocusForm";
import { useFocusPeriods } from "@/hooks/UseFocusPeriods";
import { useSleepTimes } from "@/hooks/UseSleepTimes";
import Summery from "../components/Summery";
import type { Recommendation } from "../components/NextCaffeineTime";
import { useCaffeineAmounts } from "../hooks/UseCaffeineAmounts";
import { useCaffeineLogs } from "@/hooks/UseCaffeineLogs";
import { useUnityContext } from "react-unity-webgl";
import Warnings from "@/components/Warnings";
import { useExpireCaffeineLogs } from "@/hooks/useExpireCaffeineLogs";
import ExpirePopup from "@/components/ExpirePopup";

// グラフの点の型定義
type GraphPoint = { time: string; value: number };

// Unityのロジックをカプセル化する新しいコンポーネント
const UnityContainer = ({
  graphData,
}: {
  graphData: { current: GraphPoint[] };
}) => {
  const { unityProvider, sendMessage, isLoaded } = useUnityContext({
    loaderUrl: "/unity/Build/Downloads.loader.js",
    dataUrl: "/unity/Build/Downloads.data",
    frameworkUrl: "/unity/Build/Downloads.framework.js",
    codeUrl: "/unity/Build/Downloads.wasm",
  });

  // Unityに集中度データを送信するタイマー処理
  useEffect(() => {
    if (!isLoaded || graphData.current.length === 0) {
      return;
    }
    const intervalId = setInterval(() => {
      const now = new Date();
      const timeToMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
      };
      const nowInMinutes = now.getHours() * 60 + now.getMinutes();

      // ★★★★★★★ 修正点: 二分探索（バイナリサーチ）で効率化 ★★★★★★★
      let low = 0;
      let high = graphData.current.length - 1;
      let closestPoint = graphData.current[0];

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const midPoint = graphData.current[mid];
        const midTimeInMinutes = timeToMinutes(midPoint.time);

        if (
          Math.abs(midTimeInMinutes - nowInMinutes) <
          Math.abs(timeToMinutes(closestPoint.time) - nowInMinutes)
        ) {
          closestPoint = midPoint;
        }

        if (midTimeInMinutes < nowInMinutes) {
          low = mid + 1;
        } else if (midTimeInMinutes > nowInMinutes) {
          high = mid - 1;
        } else {
          closestPoint = midPoint;
          break;
        }
      }
      // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

      if (closestPoint) {
        sendMessage(
          "unitychan",
          "SetAnimationSpeed",
          closestPoint.value.toString(),
        );
      }
    }, 2000);
    return () => clearInterval(intervalId);
  }, [isLoaded, sendMessage, graphData]);

  return <UnityModelWrapper unityProvider={unityProvider} />;
};

const HomePage: React.FC = () => {
  const { bedTime, wakeTime, setBedTime, setWakeTime } = useSleepTimes();
  const { focusPeriods, addFocusPeriod, removeFocusPeriod, updateFocusPeriod } =
    useFocusPeriods();

  const [logs, setLogs] = useCaffeineLogs();
  const amounts = useCaffeineAmounts(logs);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogFormOpen, setIsLogFormOpen] = useState(true);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [graphData, setGraphData] = useState<{
    simulation: GraphPoint[];
    current: GraphPoint[];
  }>({ simulation: [], current: [] });
  const [activeGraph, setActiveGraph] = useState<"simulation" | "current">(
    "simulation",
  );

  const [unityKey, setUnityKey] = useState(1);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [minPerformances, setMinPerformances] = useState<number[]>([]);
  const [targetPerformance, setTargetPerformance] = useState<number>(0.7);

  // 起床時刻＋24時間でローカルストレージ内のすべてのデータを自動消去&ポップアップ表示
  // 次のカフェイン摂取時間や摂取履歴も削除される
  const [showExpirePopup, setShowExpirePopup] = useState(false);
  useExpireCaffeineLogs(wakeTime, ["caffeine-logs"], () => {
    setShowExpirePopup(true);
    setLogs([]);
    setRecommendations([]);
  });

  // ローカルストレージから初期データを取得
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker 登録成功:", registration);

          // 通知の許可を求める
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("通知の許可が得られました。");
          } else {
            console.log("通知は許可されませんでした。");
          }
        } catch (error) {
          console.error("Service Worker 登録失敗:", error);
        }
      }
    };
    registerServiceWorker();
  }, []); // 空の依存配列で初回レンダリング時のみ実行

  const isValid = useCallback(() => {
    return (
      !!bedTime && !!wakeTime && focusPeriods.some((p) => p.start && p.end)
    );
  }, [bedTime, wakeTime, focusPeriods]);

  const handleGeneratePlan = useCallback(async () => {
    if (!isValid()) {
      setError("集中時間・睡眠時間を入力してください");
      return;
    }
    setError("");
    setIsLoading(true);
    setGraphData({ simulation: [], current: [] });

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_time: bedTime,
          wake_time: wakeTime,
          focus_periods: focusPeriods,
          caffeine_logs: logs,
        }),
      });

      if (!response.ok) {
        throw new Error("APIリクエストに失敗しました");
      }
      const result = await response.json();

      // 既存の画面表示用のstate更新
      setGraphData({
        simulation: result.simulationData || [],
        current: result.currentStatusData || [],
      });
      setRecommendations(result.caffeinePlan || []);
      setMinPerformances(result.minPerformances || []);
      setTargetPerformance(result.targetPerformance);
      setActiveGraph("simulation");
      setUnityKey((prevKey) => prevKey + 1);

      // ★★★ ここからが新しい処理 ★★★
      if (result.caffeinePlan && result.caffeinePlan.length > 0) {
        // 1. 既存のスケジュールをすべてクリア
        await clearSchedules();

        // 2. APIのレスポンスをIndexedDBに保存できる形式に変換
        const schedulesToSave = result.caffeinePlan.map(
          (p: { time: string; caffeineAmount: number }) => {
            const [hours, minutes] = p.time.split(":").map(Number);
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);

            // もし計算された時間が現在時刻より過去なら、明日の日付にする
            if (scheduleDate < new Date()) {
              scheduleDate.setDate(scheduleDate.getDate() + 1);
            }

            return {
              time: scheduleDate.getTime(), // Unixタイムスタンプ (ミリ秒)
              caffeineAmount: p.caffeineAmount,
            };
          },
        );

        // 3. IndexedDBに新しいスケジュールを保存
        await saveSchedules(schedulesToSave);

        // 4. Service Workerにスケジュール更新を通知
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SCHEDULE_UPDATED",
          });
          console.log("Service Workerにスケジュール更新を通知しました。");
        }
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      setError("プラン生成中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [bedTime, wakeTime, focusPeriods, isValid, logs]);

  useEffect(() => {
    if (!localStorage.getItem("initial-setup-complete")) {
      setShowSettingModal(true);
    } else {
      handleGeneratePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    handleGeneratePlan();
    setActiveGraph("current");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs]);

  return (
    <div>
      <Warnings
        minPerformances={minPerformances}
        targetPerformance={targetPerformance}
      />
      {showExpirePopup && (
        <ExpirePopup onClose={() => setShowExpirePopup(false)} />
      )}
      <TopBackButton />
      {showSettingModal && (
        <SettingModal
          onClose={(mins, tgt) => {
            setMinPerformances(mins);
            setTargetPerformance(tgt);
            setShowSettingModal(false);
          }}
        />
      )}
      {!showSettingModal && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
          <div className="w-full max-w-2xl flex justify-center">
            <UnityContainer key={unityKey} graphData={graphData} />
          </div>

          <div className="w-full max-w-2xl mx-auto flex flex-row items-center justify-center gap-1 mt-8 px-0">
            <div className="flex-2">
              <RecommendedPlanList recommendations={recommendations} />
            </div>
            <div className="flex-1">
              <Summery caffeineData={amounts} />
            </div>
          </div>

          <div className="w-full max-w-2xl mx-auto mt-8 mb-2">
            <div className="flex items-center mb-2">
              <button
                type="button"
                className="mr-3 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition text-xl"
                onClick={() => setIsLogFormOpen((p) => !p)}
                aria-label={isLogFormOpen ? "閉じる" : "開く"}
              >
                {isLogFormOpen ? "-" : "+"}
              </button>
              <h2 className="text-lg font-bold text-gray-800">
                カフェイン摂取記録
              </h2>
            </div>
            {isLogFormOpen && <CaffeineLogForm logs={logs} setLogs={setLogs} />}
          </div>

          <main className="flex flex-col items-start flex-1 w-full max-w-2xl mx-auto px-4">
            <SleepForm
              bedTime={bedTime}
              wakeTime={wakeTime}
              setBedTime={setBedTime}
              setWakeTime={setWakeTime}
              disabled={isLoading}
            />
            <FocusForm
              focusPeriods={focusPeriods}
              addFocusPeriod={addFocusPeriod}
              removeFocusPeriod={removeFocusPeriod}
              updateFocusPeriod={updateFocusPeriod}
              disabled={isLoading}
            />

            {error && (
              <div className="text-red-600 font-semibold mb-3">{error}</div>
            )}

            <div className="w-full flex justify-center mt-8 mb-6">
              <BlueButton
                label={isLoading ? "計画生成中..." : "カフェイン計画を生成する"}
                href="#"
                onClick={handleGeneratePlan}
                disabled={isLoading}
              />
            </div>

            {(graphData.simulation.length > 0 ||
              graphData.current.length > 0) && (
              <div className="w-full max-w-2xl flex flex-col items-center justify-center mt-8">
                <div className="flex justify-center gap-4 mb-4">
                  <button
                    onClick={() => setActiveGraph("simulation")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeGraph === "simulation" ? "bg-indigo-500 text-white shadow" : "bg-gray-200 text-gray-700"}`}
                  >
                    理想の集中度
                  </button>
                  <button
                    onClick={() => setActiveGraph("current")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeGraph === "current" ? "bg-teal-500 text-white shadow" : "bg-gray-200 text-gray-700"}`}
                  >
                    現在の集中度
                  </button>
                </div>
                <div className="w-full">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                    カフェイン効果予測
                  </h3>
                  <Chart data={graphData[activeGraph]} />
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default HomePage;
