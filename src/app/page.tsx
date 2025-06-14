"use client";
import React, { useState } from "react";
import BlueButton from "../components/BlueButton";
import UnityModel from "../components/UnityModel";
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

const HomePage: React.FC = () => {
  // developブランチの新しいカスタムフックで状態を管理
  const { bedTime, wakeTime, setBedTime, setWakeTime } = useSleepTimes();
  // 状態の初期化（localStorageの値を優先）
  const { focusPeriods, addFocusPeriod, removeFocusPeriod, updateFocusPeriod } =
    useFocusPeriods();

  // あなたが追加した、エラー、ローディング、グラフ関連のstate
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  type GraphPoint = { time: string; value: number };
  const [graphData, setGraphData] = useState<{
    simulation: GraphPoint[];
    current: GraphPoint[];
  }>({ simulation: [], current: [] });
  const [activeGraph, setActiveGraph] = useState<"simulation" | "current">(
    "simulation",
  );

  // 入力チェック関数を、developブランチの変数名(camelCase)に合わせる
  const isValid = () => {
    return (
      !!bedTime && !!wakeTime && focusPeriods.some((p) => p.start && p.end)
    );
  };

  const recommendations: Recommendation[] = [
    { time: "14:00", caffeineAmount: 95 },
    { time: "20:30", caffeineAmount: 30 },
  ];

  // あなたが実装したAPI呼び出し関数を、developブランチの変数名に合わせる
  const handleGeneratePlan = async () => {
    if (!isValid()) {
      setError("集中時間・睡眠時間を入力してください");
      return;
    }
    setError("");
    setIsLoading(true);
    setGraphData({ simulation: [], current: [] });

    try {
      const savedLogs = window.localStorage.getItem("caffeine-logs");
      const caffeine_logs = savedLogs ? JSON.parse(savedLogs) : [];

      const requestData = {
        bed_time: bedTime, // 変数名を修正
        wake_time: wakeTime, // 変数名を修正
        focus_periods: focusPeriods,
        caffeine_logs,
      };

      const response = await fetch("/api/focus-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("APIリクエストに失敗しました");
      }

      const result = await response.json();

      setGraphData({
        simulation: result.simulationData || [],
        current: result.currentStatusData || [],
      });
      setActiveGraph("simulation");
    } catch (error) {
      console.error("エラーが発生しました:", error);
      setError("プラン生成中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>
        <TopBackButton />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
          <div className="w-full max-w-2xl flex justify-center">
            <UnityModel />
          </div>

          {/* developブランチの新しいレイアウトを採用 */}
          <div className="w-full max-w-4xl mx-auto flex flex-row items-start justify-center gap-1 mt-8 px-0">
            <div className="flex-1">
              <RecommendedPlanList recommendations={recommendations} />
            </div>
            <div className="flex-1">
              <Summery caffeineData={[10, 60, 90]} />{" "}
              {/* サマリーのデータは仮 */}
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
            {isLogFormOpen && <CaffeineLogForm />}
          </div>

          <main className="flex flex-col items-center flex-1 w-full max-w-2xl mx-auto">
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
                label={isLoading ? "計画生成中..." : "カフェイン計画を生成する"}
                href="#"
                onClick={handleGeneratePlan}
                disabled={isLoading}
              />
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
                    理想の覚醒度
                  </button>
                  <button
                    onClick={() => setActiveGraph("current")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeGraph === "current" ? "bg-teal-500 text-white shadow" : "bg-gray-200 text-gray-700"}`}
                  >
                    現在の覚醒度
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
      </div>
    </div>
  );
};

export default HomePage;
