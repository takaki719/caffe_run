"use client";
import React, { useState } from "react";
const SettingPage: React.FC = () => {
  // 睡眠
  const [bed_time, setBedTime] = useState("");
  const [wake_time, setWakeTime] = useState("");

  // 集中時間（可変リスト）
  type FocusPeriod = { start: string; end: string };
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([
    { start: "", end: "" },
  ]);

  const updateFocusPeriod = (
    idx: number,
    key: "start" | "end",
    value: string,
  ) => {
    setFocusPeriods((periods) =>
      periods.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-0 flex flex-col">
      {/* メイン */}
      <main className="flex flex-col items-center flex-1 w-full max-w-2xl mx-auto">
        {/* 睡眠セクション */}
        <section className="w-full mb-8">
          <div className="flex items-center gap-3 w-full">
            <label className="text-gray-600 text-sm font-medium min-w-[95px]">
              睡眠時間
            </label>
            <input
              type="time"
              value={bed_time}
              onChange={(e) => setBedTime(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24"
            />
            <span className="text-gray-500">～</span>
            <input
              type="time"
              value={wake_time}
              onChange={(e) => setWakeTime(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24"
            />
          </div>
        </section>

        {/* 集中セクション */}
        <section className="w-full mb-12">
          <div className="flex flex-col gap-3">
            {focusPeriods.map((period, idx) => (
              <div
                key={idx}
                className="flex flex-row items-center gap-2 sm:gap-4 w-full flex-wrap"
              >
                <label className="text-gray-600 text-sm font-medium min-w-[95px] mb-0">
                  集中時間
                </label>
                <input
                  type="time"
                  value={period.start}
                  onChange={(e) =>
                    updateFocusPeriod(idx, "start", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24"
                />
                <span className="text-gray-500">～</span>
                <input
                  type="time"
                  value={period.end}
                  onChange={(e) =>
                    updateFocusPeriod(idx, "end", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24"
                />
              </div>
            ))}
            {/* 追加ボタン（省略） */}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingPage;
