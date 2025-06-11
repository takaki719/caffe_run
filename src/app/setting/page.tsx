"use client";
import React, { useState } from "react";
import BlueButton from "../../components/BlueButton";
import TopBackButton from "@/components/TopBackButton";
import { useRouter } from "next/navigation";

const SettingPage: React.FC = () => {
  // 睡眠
  const [bed_time, setBedTime] = useState("");
  const [wake_time, setWakeTime] = useState("");

  // 集中時間（可変リスト）
  type FocusPeriod = { start: string; end: string };
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([
    { start: "", end: "" },
  ]);

  // エラーメッセージ
  const [error, setError] = useState("");

  // 集中時間の追加
  const addFocusPeriod = () =>
    setFocusPeriods([...focusPeriods, { start: "", end: "" }]);

  // 集中帯削除
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

  // バリデーション
  const isValid = () => {
    // 睡眠時間：どちらかが未入力ならNG
    if (!bed_time || !wake_time) return false;
    // 集中時間：少なくとも1つ、startとendが両方入力された期間があるか
    const hasValidFocus = focusPeriods.some((p) => p.start && p.end);
    if (!hasValidFocus) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-0 flex flex-col">
      <TopBackButton />
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
        {/* エラー表示 */}
        {error && (
          <div className="text-red-600 font-semibold mb-3">{error}</div>
        )}
        {/* ボタン */}
        <div className="w-full flex justify-center mt-8 mb-6">
          <BlueButton
            label="カフェイン計画を生成する"
            href="../check-state"
            onClick={() => {
              if (!isValid()) {
                setError("集中時間・睡眠時間を入力してください");
                return false; // ←遷移させない
              }
              setError("");
              // 何も返さなければ遷移OK
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default SettingPage;
