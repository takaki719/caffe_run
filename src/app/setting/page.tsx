"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import TopBackButton from "@/components/TopBackButton";

const SettingPage: React.FC = () => {
  const router = useRouter();

  const [bed_time, setBedTime] = useState("");
  const [wake_time, setWakeTime] = useState("");
  type FocusPeriod = { start: string; end: string };
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([
    { start: "", end: "" },
  ]);

  useEffect(() => {
    const savedBedTime = localStorage.getItem("bed_time");
    const savedWakeTime = localStorage.getItem("wake_time");
    const savedFocusPeriods = localStorage.getItem("focus_periods");
    
    if (savedBedTime) setBedTime(savedBedTime);
    if (savedWakeTime) setWakeTime(savedWakeTime);
    if (savedFocusPeriods) {
      setFocusPeriods(JSON.parse(savedFocusPeriods));
    }
  }, []);

  // 各stateが変更されるたびにlocalStorageに保存する
  useEffect(() => {
    localStorage.setItem("bed_time", bed_time);
  }, [bed_time]);

  useEffect(() => {
    localStorage.setItem("wake_time", wake_time);
  }, [wake_time]);

  useEffect(() => {
    localStorage.setItem("focus_periods", JSON.stringify(focusPeriods));
  }, [focusPeriods]);    

  const addFocusPeriod = () =>
    setFocusPeriods([...focusPeriods, { start: "", end: "" }]);

  const removeFocusPeriod = (idx: number) =>
    setFocusPeriods(focusPeriods.filter((_, i) => i !== idx));

  const updateFocusPeriod = (
    idx: number,
    key: "start" | "end",
    value: string,
  ) => {
    setFocusPeriods((periods) =>
      periods.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    );
  };
  
  const handleGeneratePlan = async () => {
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
      localStorage.setItem("focusData", JSON.stringify(result.data));

      // 成功したら結果表示ページに遷移
      router.push("/check-state");

    } catch (error) {
      console.error("エラーが発生しました:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-0 flex flex-col">
      <TopBackButton />
      <main className="flex flex-col items-center flex-1 w-full max-w-2xl mx-auto">
        {/* ... (睡眠セクションと集中セクションのJSXは変更なし) ... */}
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
                {focusPeriods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFocusPeriod(idx)}
                    className="ml-2 text-red-500 font-bold text-lg px-2 rounded hover:bg-red-100"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {/* 追加ボタン */}
            <button
              type="button"
              onClick={addFocusPeriod}
              className="mt-2 flex items-center text-blue-600 font-semibold hover:underline"
            >
              <span className="text-xl mr-1">＋</span>集中時間帯を追加
            </button>
          </div>
        </section>
        
        {/* ボタンをonClickで関数を呼び出すように変更 */}
        <div className="w-full flex justify-center mt-8 mb-6">
          <button
            onClick={handleGeneratePlan} // クリックでデータ送信
            className="
              inline-block w-full sm:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600
              text-white font-semibold rounded-xl shadow-md text-base sm:text-lg
              text-center transition focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          >
            カフェイン計画を生成する
          </button>
        </div>
      </main>
    </div>
  );
};

export default SettingPage;