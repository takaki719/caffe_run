"use client";
import React, { useState, useEffect } from "react";
import BlueButton from "../components/BlueButton";
import UnityModel from "../components/UnityModel";
import TopBackButton from "@/components/TopBackButton";
import Chart from "@/components/Chart";
import RecommendedPlanList from "../components/NextCaffeineTime";
import CaffeineLogForm from "../components/CaffeineLogForm";
import type { Recommendation } from "../components/NextCaffeineTime";

// LocalStorageのキーを定数として定義
const SLEEP_TIME_KEY = "caffe-run-sleep-time";
const FOCUS_PERIODS_KEY = "caffe-run-focus-periods";

const HomePage: React.FC = () => {
  const [bed_time, setBedTime] = useState("");
  const [wake_time, setWakeTime] = useState("");
  type FocusPeriod = { start: string; end: string };
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([
    { start: "", end: "" },
  ]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);

  // --- グラフ関連のstate定義 ---
  const [graphData, setGraphData] = useState<{simulation: any[], current: any[]}>({ simulation: [], current: [] });
  const [activeGraph, setActiveGraph] = useState<'simulation' | 'current'>('simulation');

  // LocalStorageからのデータ読み込み処理
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSleepTime = window.localStorage.getItem(SLEEP_TIME_KEY);
        if (savedSleepTime) {
          const { bed_time: savedBed, wake_time: savedWake } = JSON.parse(savedSleepTime);
          setBedTime(savedBed || "");
          setWakeTime(savedWake || "");
        }
        const savedFocusPeriods = window.localStorage.getItem(FOCUS_PERIODS_KEY);
        if (savedFocusPeriods && JSON.parse(savedFocusPeriods).length > 0) {
          setFocusPeriods(JSON.parse(savedFocusPeriods));
        }
      } catch (e) {
        console.error("Failed to load page data from local storage", e);
      }
    }
  }, []);

  // LocalStorageへのデータ保存処理
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const sleepTimeData = JSON.stringify({ bed_time, wake_time });
        window.localStorage.setItem(SLEEP_TIME_KEY, sleepTimeData);
        
        const focusPeriodsData = JSON.stringify(focusPeriods);
        window.localStorage.setItem(FOCUS_PERIODS_KEY, focusPeriodsData);
      } catch (e) {
        console.error("Failed to save page data to local storage", e);
      }
    }
  }, [bed_time, wake_time, focusPeriods]);

  const addFocusPeriod = () =>
    setFocusPeriods([...focusPeriods, { start: "", end: "" }]);

  const removeFocusPeriod = (idx: number) =>
    setFocusPeriods(focusPeriods.filter((_, i) => i !== idx));

  const updateFocusPeriod = (
    idx: number,
    key: "start" | "end",
    value: string,
  ) => {
    setFocusPeriods((periods) =>
      periods.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    );
  };

  const isValid = () => {
    if (!bed_time || !wake_time) return false;
    const hasValidFocus = focusPeriods.some((p) => p.start && p.end);
    if (!hasValidFocus) return false;
    return true;
  };

  // --- ここが最後の修正点 ---
  // モックデータを新しい Recommendation 型 `{ time, caffeineAmount }` に合わせる
  const recommendations: Recommendation[] = [
    { time: "14:00", caffeineAmount: 95 },
    { time: "20:30", caffeineAmount: 30 },
  ];

  // --- handleGeneratePlan 関数をここから変更 ---
  const handleGeneratePlan = async () => {
    if (!isValid()) {
      setError("集中時間・睡眠時間を入力してください");
      return;
    }
    setError("");
    setIsLoading(true);
    setGraphData({ simulation: [], current: [] }); // ボタンを押したら一旦グラフをクリア

    try {
      const savedLogs = window.localStorage.getItem("caffeine-logs");
      const caffeine_logs = savedLogs ? JSON.parse(savedLogs) : [];

      const requestData = {
        bed_time,
        wake_time,
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

      // --- ここからが重要な修正点 ---
      // response.json() の呼び出しと、stateの更新を try ブロックの内側に移動
      const result = await response.json();
      
      setGraphData({
        simulation: result.simulationData || [],
        current: result.currentStatusData || [],
      });
      // デフォルトでシミュレーショングラフをアクティブにする
      setActiveGraph('simulation');
      // --- ここまで ---

    } catch (error) {
      console.error("エラーが発生しました:", error);
      setError("プラン生成中にエラーが発生しました");
      setGraphData({ simulation: [], current: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // --- ★★★ ここにデバッグ用のコードを追加 ★★★ ---
  console.log("--- ページが再描画されました ---");
  console.log("現在アクティブなグラフ:", activeGraph);
  console.log("保持している全グラフデータ:", graphData);
  console.log("Chartコンポーネントに渡すデータ:", graphData[activeGraph]);
  // --- ★★★ ここまで ★★★ ---

  return (
    <div>
      <div>
        <TopBackButton />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
          <div className="w-full max-w-2xl flex justify-center">
            <UnityModel />
          </div>
          <div className="w-full max-w-4xl mx-auto px-4 mt-8">
            <RecommendedPlanList recommendations={recommendations} />
          </div>

          <div className="w-full max-w-2xl mx-auto my-8">
            <div className="flex items-center mb-2">
              <button
                type="button"
                className="mr-3 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition text-xl"
                onClick={() => setIsLogFormOpen((prev) => !prev)}
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
            {/* ...睡眠セクションと集中セクションは変更なし... */}
            <section className="w-full mb-8 mt-8">
              <div className="flex items-center gap-3 w-full">
                <label className="text-gray-600 text-sm font-medium min-w-[95px]">
                  睡眠時間
                </label>
                <input type="time" value={bed_time} onChange={(e) => setBedTime(e.target.value)} className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24" disabled={isLoading} />
                <span className="text-gray-500">～</span>
                <input type="time" value={wake_time} onChange={(e) => setWakeTime(e.target.value)} className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24" disabled={isLoading} />
              </div>
            </section>
            <section className="w-full mb-8">
              <div className="flex flex-col gap-8">
                {focusPeriods.map((period, idx) => (
                  <div key={idx} className="flex items-center gap-3 w-full">
                    <label className="text-gray-600 text-sm font-medium min-w-[95px]">
                      集中時間
                    </label>
                    <input type="time" value={period.start} onChange={(e) => updateFocusPeriod(idx, "start", e.target.value)} className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24" disabled={isLoading} />
                    <span className="text-gray-500">～</span>
                    <input type="time" value={period.end} onChange={(e) => updateFocusPeriod(idx, "end", e.target.value)} className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24" disabled={isLoading} />
                    {focusPeriods.length > 1 && (<button type="button" onClick={() => removeFocusPeriod(idx)} className="ml-2 text-red-500 font-bold text-lg px-2 rounded hover:bg-red-100" disabled={isLoading}>×</button>)}
                  </div>
                ))}
                <button type="button" onClick={addFocusPeriod} className="mt-2 flex items-center text-blue-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                  <span className="text-xl mr-1">＋</span>集中時間帯を追加
                </button>
              </div>
            </section>

            {error && (<div className="text-red-600 font-semibold mb-3">{error}</div>)}

            <div className="w-full flex justify-center mt-8 mb-6">
              <BlueButton label={isLoading ? "計画生成中..." : "カフェイン計画を生成する"} href="#" onClick={handleGeneratePlan} disabled={isLoading}/>
            </div>

            {/* --- グラフ表示部分 --- */}
            {(graphData.simulation.length > 0 || graphData.current.length > 0) && (
              <div className="w-full max-w-2xl flex flex-col items-center justify-center mt-8">
                <div className="flex justify-center gap-4 mb-4">
                  <button 
                    onClick={() => setActiveGraph('simulation')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeGraph === 'simulation' ? 'bg-indigo-500 text-white shadow' : 'bg-gray-200 text-gray-700'}`}
                  >
                    理想の覚醒度
                  </button>
                  <button 
                    onClick={() => setActiveGraph('current')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeGraph === 'current' ? 'bg-teal-500 text-white shadow' : 'bg-gray-200 text-gray-700'}`}
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
            {/* --- ここまで変更 --- */}
          </main>
        </div>
      </div>
    </div>
  );
};

export default HomePage;