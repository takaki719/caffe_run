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
  // 現在の集中力値を計算
  const getCurrentFocusValue = (): number => {
    if (graphData.current.length === 0) return 0;

    const now = new Date();
    const timeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();

    // 最も近い時刻のデータを取得
    let closestPoint = graphData.current[0];
    let minDiff = Infinity;

    for (const point of graphData.current) {
      const pointMinutes = timeToMinutes(point.time);
      const diff = Math.abs(pointMinutes - nowInMinutes);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = point;
      }
    }

    return closestPoint.value;
  };
  const [isUnityReady, setIsUnityReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentFocus, setCurrentFocus] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    unityProvider,
    sendMessage,
    isLoaded,
    addEventListener,
    removeEventListener,
  } = useUnityContext({
    loaderUrl: "/unity/Build/Downloads.loader.js",
    dataUrl: "/unity/Build/Downloads.data",
    frameworkUrl: "/unity/Build/Downloads.framework.js",
    codeUrl: "/unity/Build/Downloads.wasm",
  });

  // Unity エラーハンドリング
  useEffect(() => {
    const handleUnityError = (...parameters: unknown[]) => {
      console.warn("Unity error detected:", parameters);
      setHasError(true);
      setIsUnityReady(false);

      // インターバルをクリア
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleUnityLoaded = () => {
      console.log("Unity loaded successfully");
      setIsUnityReady(true);
      setHasError(false);
      setRetryCount(0);
    };

    if (addEventListener && removeEventListener) {
      addEventListener("error", handleUnityError);
      addEventListener("loaded", handleUnityLoaded);

      return () => {
        removeEventListener("error", handleUnityError);
        removeEventListener("loaded", handleUnityLoaded);
      };
    }
  }, [addEventListener, removeEventListener]);

  // Unity初期化状態の管理
  useEffect(() => {
    if (isLoaded && unityProvider && !hasError) {
      setIsUnityReady(true);
    } else {
      setIsUnityReady(false);
    }
  }, [isLoaded, unityProvider, hasError]);

  // 現在の集中力値を定期的に更新
  useEffect(() => {
    const updateCurrentFocus = () => {
      const focus = getCurrentFocusValue();
      setCurrentFocus(focus);
    };

    // 初回更新
    updateCurrentFocus();

    // 30秒ごとに更新
    const focusInterval = setInterval(updateCurrentFocus, 30000);

    return () => clearInterval(focusInterval);
  }, [graphData]);

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Unityのクリーンアップは完全に無効化（エラーの原因）
      // unloadは呼び出さない
      setIsUnityReady(false);
    };
  }, []);

  // Unityに集中度データを送信するタイマー処理
  useEffect(() => {
    // インターバルをクリア
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (
      !isUnityReady ||
      !isLoaded ||
      graphData.current.length === 0 ||
      hasError
    ) {
      return;
    }

    // 安全な送信間隔を設定（5秒間隔）
    intervalRef.current = setInterval(() => {
      try {
        // Unity の状態を再確認
        if (!isLoaded || hasError) {
          return;
        }

        const now = new Date();
        const timeToMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(":").map(Number);
          return h * 60 + m;
        };
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();

        // シンプルな最寄り時刻検索
        let closestPoint = graphData.current[0];
        let minDiff = Infinity;

        for (const point of graphData.current) {
          const pointMinutes = timeToMinutes(point.time);
          const diff = Math.abs(pointMinutes - nowInMinutes);
          if (diff < minDiff) {
            minDiff = diff;
            closestPoint = point;
          }
        }

        if (closestPoint && sendMessage) {
          // より安全なメッセージ送信
          try {
            // 値を0-1の範囲に正規化
            const normalizedValue = Math.max(
              0,
              Math.min(1, closestPoint.value / 100),
            );
            sendMessage(
              "unitychan",
              "SetAnimationSpeed",
              normalizedValue.toString(),
            );
          } catch (msgError) {
            console.warn("Unity message send failed:", msgError);
            // エラーが発生した場合はエラー状態に設定
            setHasError(true);
          }
        }
      } catch (error) {
        console.warn("Unity timer error:", error);
        setHasError(true);
      }
    }, 5000); // 5秒間隔

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isUnityReady, isLoaded, graphData, hasError, sendMessage]);

  // エラー状態の場合は代替表示
  if (hasError) {
    return (
      <div className="relative">
        <div className="flex-1 bg-gray-200 rounded-2xl flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] w-full">
          <div className="text-gray-500 text-center">
            <div className="mb-2">🎮</div>
            <div>Unity表示でエラーが発生しました</div>
            <div className="text-xs mt-1">リトライ回数: {retryCount}</div>
            <button
              onClick={() => {
                if (retryCount < 3) {
                  setHasError(false);
                  setIsUnityReady(false);
                  setRetryCount((prev) => prev + 1);
                } else {
                  // 3回リトライ後はページリロード
                  window.location.reload();
                }
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              {retryCount < 3 ? "再試行" : "ページを再読み込み"}
            </button>
          </div>
        </div>
        {/* 現在の集中力表示 */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="text-xs font-medium">現在の集中力</div>
          <div className="text-lg font-bold text-center">
            {Math.round(currentFocus)}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <UnityModelWrapper unityProvider={unityProvider} />
      {/* 現在の集中力表示 */}
      <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg shadow-lg">
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
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        throw new Error(`APIリクエストに失敗しました (${response.status}: ${response.statusText})`);
      }
      const result = await response.json();
      setGraphData({
        simulation: result.simulationData || [],
        current: result.currentStatusData || [],
      });
      setRecommendations(result.caffeinePlan || []);
      setMinPerformances(result.minPerformances || []);
      setTargetPerformance(result.targetPerformance);
      setActiveGraph("simulation");

      setUnityKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error("プラン生成エラー詳細:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      setError(`プラン生成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
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
                    {activeGraph == "simulation" &&<h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                      カフェイン効果予測
                    </h3>
                    }
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
                  <div className="text-red-600 font-semibold mb-3">{error}</div>
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
