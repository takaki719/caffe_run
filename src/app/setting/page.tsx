"use client";
import React, { useState } from "react";
const SettingPage: React.FC = () => {
  // 睡眠
  const [bed_time, setBedTime] = useState("");
  const [wake_time, setWakeTime] = useState("");

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
      </main>
    </div>
  );
};

export default SettingPage;
