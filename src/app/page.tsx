"use client";
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
import Dashboard from "@/components/Dashboard";
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
  const [currentFocus, setCurrentFocus] = useState(0);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  const { unityProvider, sendMessage, isLoaded } = useUnityContext({
    loaderUrl: "/unity/Build/Downloads.loader.js",
    dataUrl: "/unity/Build/Downloads.data",
    frameworkUrl: "/unity/Build/Downloads.framework.js",
    codeUrl: "/unity/Build/Downloads.wasm",
  });

  // 2秒後にローディングオーバーレイを非表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingOverlay(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // 現在の集中力値を計算する関数
  const getCurrentFocusValue = (): number => {
    if (graphData.current.length === 0) return 0;

    const now = new Date();
    const timeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();

    // 二分探索で最も近い時刻のデータを取得
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

    return closestPoint.value;
  };

  // Unityに集中度データを送信するタイマー処理
  useEffect(() => {
    if (!isLoaded || graphData.current.length === 0) {
      return;
    }
    const intervalId = setInterval(() => {
      const focusValue = getCurrentFocusValue();
      setCurrentFocus(focusValue);

      sendMessage("unitychan", "SetAnimationSpeed", focusValue.toString());
    }, 2000);
    return () => clearInterval(intervalId);
  }, [isLoaded, sendMessage, graphData]);

  return (
    <div className="relative">
      <UnityModelWrapper unityProvider={unityProvider} />

      {/* スクロール用オーバーレイ（Unity上を覆う） */}
      {!showLoadingOverlay && (
        <div
          className="absolute inset-0 z-10 bg-transparent cursor-default"
          style={{ pointerEvents: "auto" }}
          onMouseDown={(e) => e.preventDefault()}
          onMouseUp={(e) => e.preventDefault()}
          onMouseMove={(e) => e.preventDefault()}
          onClick={(e) => e.preventDefault()}
          onWheel={(e) => {
            // ホイールイベントを親要素に委譲してスクロールを維持
            const parent = e.currentTarget.parentElement?.parentElement;
            if (parent) {
              parent.scrollBy({
                top: e.deltaY,
                behavior: "auto",
              });
            }
          }}
        ></div>
      )}

      {/* ローディングオーバーレイ（3秒間のみ表示） */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex flex-col items-center justify-center z-30">
          <div className="text-center">
            {/* ローディングアニメーション */}
            <div className="mb-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>

            {/* ローディングテキスト */}
            <div className="text-gray-700">
              <div className="text-lg font-semibold mb-2">
                3Dキャラクター読み込み中...
              </div>
              <div className="text-sm text-gray-600">もうすぐ完了します</div>
            </div>
          </div>
        </div>
      )}

      {/* 現在の集中力表示 */}
      <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg shadow-lg z-40">
        <div className="text-xs font-medium">現在の集中力</div>
        <div className="text-lg font-bold text-center">
          {Math.round(currentFocus)}%
        </div>
      </div>
    </div>
  );
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

  const [activeView, setActiveView] = useState<"dashboard" | "detailed">(
    "detailed",
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
    const savedLogs = localStorage.getItem("caffeine-logs");
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

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
      const requestBody = {
        bed_time: bedTime,
        wake_time: wakeTime,
        focus_periods: focusPeriods,
        caffeine_logs: logs,
      };

      console.log("API Request Body:", requestBody);

      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: errorText,
        });
        throw new Error(
          `APIリクエストに失敗しました (${response.status}: ${response.statusText}) - ${errorText}`,
        );
      }
      const result = await response.json();
      setGraphData({
        simulation: result.simulationData || [],
        current: result.currentStatusData || [],
      });
      setRecommendations((result.caffeinePlan || []).map((rec: { time: string; mg: number }) => ({
        time: rec.time,
        caffeineAmount: rec.mg
      })));
      setMinPerformances(result.minPerformances || []);
      setTargetPerformance(result.targetPerformance);
      setActiveGraph("simulation");

      setUnityKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error("プラン生成エラー詳細:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      setError(
        `プラン生成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [bedTime, wakeTime, focusPeriods, isValid, logs]);

  useEffect(() => {
    if (!localStorage.getItem("initial-setup-complete")) {
      setShowSettingModal(true);
    } else if (isValid()) {
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
      {showSettingModal && (
        <SettingModal
          onClose={(mins, tgt, graphData, recommendations) => {
            setMinPerformances(mins);
            setTargetPerformance(tgt);
            if (graphData) {
              setGraphData(graphData);
              setActiveGraph("simulation");
            }
            if (recommendations) {
              setRecommendations(recommendations.map((rec: { time: string; mg: number }) => ({
                time: rec.time,
                caffeineAmount: rec.mg
              })));
            }
            setShowSettingModal(false);
          }}
        />
      )}
      {!showSettingModal && (
        <div className="min-h-screen bg-gray-50">
          {/* トップバー */}
          <div className="w-full bg-white shadow-sm">
            <div className="max-w-6xl mx-auto">
              <TopBackButton />
            </div>
          </div>

          <div className="flex flex-col items-center px-4 py-8">
            {/* ビュー切り替えボタン */}
            <div className="w-full max-w-6xl mx-auto mb-6">
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setActiveView("detailed")}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    activeView === "detailed"
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-white text-gray-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  🎯 メインメニュー
                </button>
                <button
                  onClick={() => setActiveView("dashboard")}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    activeView === "dashboard"
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-white text-gray-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  📊 ダッシュボード
                </button>
              </div>
            </div>
            {/* ダッシュボードビュー */}
            {activeView === "dashboard" && (
              <>
                <Dashboard
                  logs={logs}
                  graphData={graphData}
                  recommendations={recommendations}
                  bedTime={bedTime}
                  wakeTime={wakeTime}
                  focusPeriods={focusPeriods}
                />
              </>
            )}

            {/* 詳細設定ビュー */}
            {activeView === "detailed" && (
              <>
                <div className="w-full max-w-2xl flex justify-center">
                  <UnityContainer key={unityKey} graphData={graphData} />
                </div>

                {/* developブランチの新しいレイアウトを採用 */}
                <div className="w-full max-w-2xl mx-auto flex flex-row items-center justify-center gap-1 mt-8 px-0">
                  <div className="flex-2">
                    <RecommendedPlanList
                      recommendations={recommendations}
                      wakeTime={wakeTime}
                      focusPeriods={focusPeriods}
                    />
                  </div>
                  <div className="flex-1">
                    <Summery caffeineData={amounts} />
                  </div>
                </div>
                {/* あなたが実装したグラフ表示部分 */}
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
                      {activeGraph == "simulation" && (
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                          カフェイン効果予測
                        </h3>
                      )}
                      <Chart data={graphData[activeGraph]} />
                    </div>
                  </div>
                )}
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
                  {isLogFormOpen && (
                    <CaffeineLogForm logs={logs} setLogs={setLogs} />
                  )}
                </div>
                <main className="flex flex-col items-start flex-1 w-full max-w-2xl mx-auto px-4">
                  {/* developブランチの新しいフォームコンポーネントを使用 */}
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
                    <div className="text-red-600 font-semibold mb-3">
                      {error}
                    </div>
                  )}

                  <div className="w-full flex justify-center mt-8 mb-6">
                    <BlueButton
                      label={
                        isLoading ? "計画生成中..." : "カフェイン計画を生成する"
                      }
                      href="#"
                      onClick={handleGeneratePlan}
                      disabled={isLoading}
                    />
                  </div>
                </main>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
