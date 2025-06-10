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
  const [chartData, setChartData] = useState<FocusDataPoint[]>(
    calcFocusData(wake_time, bed_time, focus_start, focus_end)
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 px-2 py-8">
      {/* グラフ枠 */}
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 mt-10">
        {/* グラフ */}
        <div className="flex-1 flex">
          <Chart data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default TimeFormPage;
