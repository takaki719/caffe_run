"use client";
import React, { useState, useEffect } from "react"; // useEffectを追加
import Chart from "../../components/Chart";
import { calcFocusData, FocusDataPoint } from "../../lib/calcFocusData";

const CheckStatePage: React.FC = () => {
  // chartDataの初期値をnullに変更し、型も許可する
  const [chartData, setChartData] = useState<FocusDataPoint[] | null>(null);

  // ページ読み込み時にlocalStorageからデータを取得してグラフデータを生成
  useEffect(() => {
    // localStorageから計画結果を取得
    const savedPlan = localStorage.getItem('caffeinePlanResult');
    
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        
        // planオブジェクトから必要な時刻データを取得
        // settingページで保存したデータ構造に合わせる
        const wakeTime = plan.wakeTime;
        const bedTime = plan.bedTime;
        const focusStart = plan.focusStart;
        const focusEnd = plan.focusEnd;

        if (wakeTime && bedTime && focusStart && focusEnd) {
          // 取得したデータでグラフデータを計算
          const data = calcFocusData(wakeTime, bedTime, focusStart, focusEnd);
          setChartData(data);
        }
      } catch (error) {
        console.error("Failed to parse plan from localStorage", error);
        // パースに失敗した場合は空のデータをセットするなど、エラーハンドリングを行う
        setChartData([]);
      }
    }
  }, []); // 空の依存配列[]を渡すことで、コンポーネントのマウント時に一度だけ実行

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 px-2 py-8">
      {/* 下部：Unityモデル枠とグラフ枠 */}
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 mt-10">
        {/* Unityモデルプレースホルダー */}
        <div className="flex-1 bg-gray-200 rounded-2xl flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] text-gray-500 text-lg font-semibold border-2 border-dashed border-gray-300">
          ここにUnityモデルが入ります
        </div>
        {/* グラフ */}
        <div className="flex-1 flex">
          {/* chartDataがnullでない場合のみChartコンポーネントを描画 */}
          {chartData ? <Chart data={chartData} /> : <p>データを読み込んでいます...</p>}
        </div>
      </div>
    </div>
  );
};

export default CheckStatePage;