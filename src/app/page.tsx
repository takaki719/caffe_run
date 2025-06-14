"use client";
import React, { useState } from "react";
import BlueButton from "../components/BlueButton";
import UnityModel from "../components/UnityModel";
import TopBackButton from "@/components/TopBackButton";
import Chart from "@/components/Chart";
import { calcFocusData, FocusDataPoint } from "@/lib/calcFocusData";
import RecommendedPlanList from "../components/NextCaffeineTime";
import CaffeineLogForm from "../components/CaffeineLogForm";
import SleepForm from "../components/SleepForm";
import FocusForm, { FocusPeriod } from "../components/FocusForm";

// モックデータの型定義(APIの実装が終わり次第削除予定)
import type { Recommendation } from "../components/NextCaffeineTime";

const HomePage: React.FC = () => {
  const [bed_time, setBedTime] = useState("");
  const [wake_time, setWakeTime] = useState("");

  // 集中時間（可変リスト）
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([
    { start: "", end: "" },
  ]);

  // エラーメッセージ
  const [error, setError] = useState("");

  // API読み込み状態
  const [isLoading, setIsLoading] = useState(false);

  // グラフデータの状態管理
  const [chartData, setChartData] = useState<FocusDataPoint[]>([]);

  // 摂取記録フォームの開閉state
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);

  // 集中時間の追加
  const addFocusPeriod = () =>
    setFocusPeriods((prev) => [...prev, { start: "", end: "" }]);

  // 集中帯削除
  const removeFocusPeriod = (idx: number) =>
    setFocusPeriods((prev) => prev.filter((_, i) => i !== idx));

  const updateFocusPeriod = (
    idx: number,
    key: "start" | "end",
    value: string,
  ) => {
    setFocusPeriods((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    );
  };

  // 睡眠時間・集中時間が入力されているかをチェックする関数
  const isValid = () => {
    if (!bed_time || !wake_time) return false;
    const hasValidFocus = focusPeriods.some((p) => p.start && p.end);
    if (!hasValidFocus) return false;
    return true;
  };

  /** モックデータ(APIの実装が終わり次第削除予定)
   * APIで受け取るrecommandationsデータのプロパティは時間とカフェイン量
   * caffeine-drink-options.tsをもとに別のところで何杯・何を飲むかを決める
   */
  const recommendations: Recommendation[] = [
    { time: "14:00", caffeineAmount: 150 },
    { time: "20:30", caffeineAmount: 200 },
  ];

  const handleGeneratePlan = async () => {
    if (!isValid()) {
      setError("集中時間・睡眠時間を入力してください");
      return;
    }

    setError("");
    setIsLoading(true);

    const planData = {
      bed_time,
      wake_time,
      focus_periods: focusPeriods,
    };

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error("APIリクエストに失敗しました");
      }

      const result = await response.json();

      // APIレスポンスからグラフデータを更新
      if (result.data) {
        setChartData(result.data);
      } else {
        // フォールバック：APIレスポンスが期待した形式でない場合
        // 最初の集中時間を使用してグラフデータを生成
        const firstFocusPeriod = focusPeriods.find((p) => p.start && p.end);
        if (firstFocusPeriod) {
          const fallbackData = calcFocusData(
            wake_time,
            bed_time,
            firstFocusPeriod.start,
            firstFocusPeriod.end,
          );
          setChartData(fallbackData);
        }
      }
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
          {/* Unityモデル枠 */}
          <div className="w-full max-w-2xl flex justify-center">
            <UnityModel />
          </div>
          {/* 次のコーヒー摂取時間 */}
          <div className="w-full max-w-4xl mx-auto px-4 mt-8">
            <RecommendedPlanList recommendations={recommendations} />
          </div>

          <div className="w-full max-w-2xl mx-auto mt-8 mb-2">
            {/* カフェイン摂取記録フォームの開閉 */}
            <div className="flex items-center mb-2">
              <button
                className="mr-3 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition text-xl"
                onClick={() => setIsLogFormOpen((p) => !p)}
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
            {/*  睡眠時間入力フォーム */}
            <SleepForm
              bedTime={bed_time}
              wakeTime={wake_time}
              setBedTime={setBedTime}
              setWakeTime={setWakeTime}
              disabled={isLoading}
            />

            {/* 集中セクション */}
            <FocusForm
              focusPeriods={focusPeriods}
              addFocusPeriod={addFocusPeriod}
              removeFocusPeriod={removeFocusPeriod}
              updateFocusPeriod={updateFocusPeriod}
              disabled={isLoading}
            />

            {/* エラー表示 */}
            {error && (
              <div className="text-red-600 font-semibold mb-3">{error}</div>
            )}

            {/* ボタン */}
            <div className="w-full flex justify-center mt-8 mb-6">
              <BlueButton
                label={isLoading ? "計画生成中..." : "カフェイン計画を生成する"}
                href="#"
                onClick={handleGeneratePlan}
                disabled={isLoading}
              />
            </div>

            {/* 集中度グラフ */}
            {chartData.length > 0 && (
              <div className="w-full max-w-2xl flex justify-center mt-8">
                <div className="w-full">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                    カフェイン効果予測
                  </h3>
                  <Chart data={chartData} />
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
