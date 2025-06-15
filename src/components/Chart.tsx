"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend, // Legendを追加
} from "recharts";

// グラフの点の型定義（APIの返り値に合わせる）
type DataPoint = {
  time: string;
  value: number; // ★キーの名前が'value'であることを定義
};

type Props = {
  data: DataPoint[];
};

const Chart: React.FC<Props> = ({ data }) => {
  // データがない場合はメッセージを表示
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        プランを生成するとグラフが表示されます
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center min-h-[240px] h-[320px] sm:h-[420px] w-full">
      <h2 className="text-base sm:text-lg font-bold mb-4 text-gray-700">
        集中力
      </h2>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} minTickGap={8} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} width={28} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value" // ★★★ ここを "focus" から "value" に変更 ★★★
            name="覚醒度"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
