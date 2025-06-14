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
import { useFocusPeriods } from "@/hooks/UseFocusPeriods";
import { useSleepTimes } from "@/hooks/UseSleepTimes";
import Summery from "@/components/Summery";

// 次に何を飲むのかのモックデータの型定義(APIの実装が終わり次第削除予定)
import type { Recommendation } from "../components/NextCaffeineTime";

const HomePage: React.FC = () => {
  // 睡眠時間の状態管理
  const { bedTime, wakeTime, setBedTime, setWakeTime } = useSleepTimes();

  // 集中時間の追加・削除・データ保持のカスタムフック
  const { focusPeriods, addFocusPeriod, removeFocusPeriod, updateFocusPeriod } = useFocusPeriods();

  // エラー / ローディング / グラフデータ / 摂取記録フォームの開閉
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<FocusDataPoint[]>([]);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);

  // 睡眠時間・集中時間が入力されているかをチェックする関数
  const isValid = () => {
    return (
      !!bedTime &&
      !!wakeTime &&
      focusPeriods.some((p) => p.start && p.end)
    );
  }

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
      bedTime,
      wakeTime,
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
            wakeTime,
            bedTime,
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
      <TopBackButton />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
        {/* Unityモデル枠 */}
        <div className="w-full max-w-2xl flex justify-center">
          <UnityModel />
        </div>
        <div className="w-full max-w-4xl mx-auto flex flex-row items-start justify-center gap-1 mt-8 px-0">
          {/* 次のカフェイン摂取時間 */}
          <div className="flex-1">
            <RecommendedPlanList recommendations={recommendations} />
          </div>
          {/* カフェイン摂取量サマリー */}
          <div className="flex-1">
            <Summery caffeineData={[10, 60, 90]} />
          </div>
        </div>
        {/* カフェイン摂取記録フォーム（タイトル＆開閉ボタン） */}
        <div className="w-full max-w-2xl mx-auto mt-8 mb-2">
          <div className="flex items-center mb-2">
            {/* 1. 円形ボタン 2. 左側に配置 */}
            <button
              type="button"
              className={`
                  mr-3 w-8 h-8 flex items-center justify-center rounded-full 
                  bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold 
                  transition text-xl
                `}
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
          {/* 睡眠セクション */}
          <section className="w-full mb-8 mt-8">
            <div className="flex items-center gap-3 w-full">
              <label className="text-gray-600 text-sm font-medium min-w-[95px]">
                睡眠時間
              </label>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24"
                disabled={isLoading}
              />
              <span className="text-gray-500">～</span>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24"
                disabled={isLoading}
              />
            </div>
          </section>

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
  );
};

export default HomePage;
