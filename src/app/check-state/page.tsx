"use client";
import React, { useState } from "react";
import Chart from "../../components/Chart";
import { calcFocusData, FocusDataPoint } from "../../lib/calcFocusData";

// グラフのモックデータ．バックエンドの実装が完了次第置き換えてください
const wake_time = "07:00";
const bed_time = "23:00";
const focus_start = "13:00";
const focus_end = "16:00";

const TimeFormPage: React.FC = () => {
  const [chartData] = useState<FocusDataPoint[]>(
    calcFocusData(wake_time, bed_time, focus_start, focus_end),
  );

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
          <Chart data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default TimeFormPage;
