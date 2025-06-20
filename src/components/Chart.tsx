// src/components/Chart.tsx
"use client";
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { Recommendation } from "./NextCaffeineTime";

type DataPoint = {
  time: string;
  value: number;
};

interface ChartProps {
  data: DataPoint[];
  recommendations?: Recommendation[]; // ★追加
}

const Chart: React.FC<ChartProps> = ({ data, recommendations = [] }) => {
  // 30分刻みでフィルタ
  const hourlyData = useMemo(
    () => data.filter((d) => d.time.endsWith(":00") || d.time.endsWith(":30")),
    [data]
  );

  // おすすめ時間をSetに
  const starTimes = useMemo(
    () => new Set(recommendations.map((r) => r.time)),
    [recommendations]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        プランを生成するとグラフが表示されます
      </div>
    );
  }

  // カスタムドット
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (starTimes.has(payload.time)) {
      // ★マークをポイントの上に表示
      return (
        <text
          x={cx}
          y={cy}
          fill="gold"
          fontSize={20}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          ★
        </text>
      );
    }
    // 普通の小さい丸
    return <circle cx={cx} cy={cy} r={4} fill="#6366f1" />;
  };

    // ホバー中の点
  const CustomActiveDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (starTimes.has(payload.time)) {
      // ホバー中の★は大きめに
      return (
        <text
          x={cx}
          y={cy}
          fill="gold"
          fontSize={32}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          ★
        </text>
      );
    }
    // ホバー中の通常点も少し大きめ
    return <circle cx={cx} cy={cy} r={6} fill="#6366f1" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center min-h-[240px] h-[320px] sm:h-[420px] w-full">
      <h2 className="text-base sm:text-lg font-bold mb-4 text-gray-700">
        集中力
      </h2>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={hourlyData}
          margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} minTickGap={8} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} width={28} />
          <Tooltip
            contentStyle={{
              color: "#000",
              backgroundColor: "#fff",
              borderRadius: "0.75rem",
              border: "1px solid #eee",
            }}
            labelStyle={{ color: "#000" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="集中度"
            stroke="#6366f1"
            strokeWidth={3}
            dot={<CustomDot />}     // ★カスタムドットを指定
            activeDot={<CustomActiveDot />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;