"use client";
import BlueButton from "../components/BlueButton";
import UnityModel from "../components/UnityModel";
import TopBackButton from "@/components/TopBackButton";
import Chart from "@/components/Chart";
import React, { useState } from "react";
import { calcFocusData, FocusDataPoint } from "@/lib/calcFocusData";
import { useRouter } from "next/navigation";

const HomePage: React.FC = () => {
  // 睡眠時間
  const router = useRouter();

  const [bed_time, setBedTime] = useState("");
  const [wake_time, setWakeTime] = useState("");

  // 集中時間（可変リスト）
  type FocusPeriod = { start: string; end: string };
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([
    { start: "", end: "" },
  ]);
  // 集中時間のモックデータ．バックエンドの実装が完了次第置き換えてください
  const focus_start = "13:00";
  const focus_end = "16:00";

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

  // 睡眠時間・集中時間が入力されているかをチェックする関数
  const isValid = () => {
    if (!bed_time || !wake_time) return false;
    const hasValidFocus = focusPeriods.some((p) => p.start && p.end);
    if (!hasValidFocus) return false;
    return true;
  };
  const [chartData] = useState<FocusDataPoint[]>(
    calcFocusData(wake_time, bed_time, focus_start, focus_end),
  );
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
    <div>
      <div>
        <TopBackButton />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
          {/* Unityモデル枠 */}
          <div className="w-full max-w-2xl flex justify-center">
            <UnityModel />
          </div>

          <main className="flex flex-col items-center flex-1 w-full max-w-2xl mx-auto">
            {/* 睡眠セクション */}
            <section className="w-full mb-8 mt-8">
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
            <section className="w-full mb-8">
              <div className="flex flex-col gap-8">
                {focusPeriods.map((period, idx) => (
                  <div key={idx} className="flex items-center gap-3 w-full">
                    <label className="text-gray-600 text-sm font-medium min-w-[95px]">
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
                // 睡眠時間・集中時間が入力されているかをチェック
                onClick={() => {
                  if (!isValid()) {
                    setError("集中時間・睡眠時間を入力してください");
                    return false;
                  }
                  setError("");
                  handleGeneratePlan();
                }}
              />
            </div>
            {/* 集中度グラフ */}
            <div className="w-full max-w-2xl flex justify-center mt-8">
              <Chart data={chartData} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
