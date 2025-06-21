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
  DotProps,
} from "recharts";

// 型定義
type DataPoint = {
  time: string;
  value: number;
};

type Props = {
  data: DataPoint[];
};

const Chart: React.FC<Props> = ({ data }) => {
  // 30分刻みのデータだけ抽出
  const hourlyData = useMemo(
    () => data.filter((d) => d.time.endsWith(":00") || d.time.endsWith(":30")),
    [data],
  );

  // 現在時刻に最も近いデータ点を取得（30分単位）
  const currentKey = useMemo(() => {
    if (hourlyData.length === 0) return null;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const closestTime = `${pad(now.getHours())}:${now.getMinutes() < 30 ? "00" : "30"}`;

    // 最も近い時刻をデータ内から探索
    const availableTimes = hourlyData.map((d) => d.time);
    if (availableTimes.includes(closestTime)) {
      return closestTime;
    } else {
      // 無ければ最も近い時刻を線形距離で探す
      const currentMinutes =
        now.getHours() * 60 + (now.getMinutes() < 30 ? 0 : 30);
      return hourlyData.reduce((prev, curr) => {
        const [h, m] = curr.time.split(":").map(Number);
        const timeMinutes = h * 60 + m;
        const prevMinutes =
          Number(prev.time.split(":")[0]) * 60 +
          Number(prev.time.split(":")[1]);
        return Math.abs(timeMinutes - currentMinutes) <
          Math.abs(prevMinutes - currentMinutes)
          ? curr
          : prev;
      }).time;
    }
  }, [hourlyData]);

  // カスタムドット：現在に一番近い点だけ★マーク

  const CustomDot: React.FC<DotProps & { payload: DataPoint }> = ({
    cx,
    cy,
    payload,
  }) => {
    if (cx == null || cy == null) return null;

    if (payload.time === currentKey) {
      return (
        <text
          x={cx}
          y={cy + 7}
          textAnchor="middle"
          fontSize={24}
          fill="#f59e0b"
        >
          ★
        </text>
      );
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        stroke="#6366f1"
        strokeWidth={2}
        fill="#6366f1"
      />
    );
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
            dot={
              <CustomDot
                payload={{
                  time: "",
                  value: 0,
                }}
              />
            }
          />
          pay
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
