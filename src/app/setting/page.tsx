"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // ★ 追加: 画面遷移のために必要
import BlueButton from "../../components/BlueButton";

const SettingPage: React.FC = () => {
  // 睡眠
  const [bed_time, setBedTime] = useState("");
  const [wake_time, setWakeTime] = useState("");

  // 集中時間（可変リスト）
  type FocusPeriod = { start: string; end: string };
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([
    { start: "", end: "" },
  ]);
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

  // ★ 追加：ルーター、ローディング、エラーのstate
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ★ 追加：APIを呼び出し、結果をlocalStorageに保存して画面遷移する関数
  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setError(null);

    // 集中時間は最初のものを使用
    const focusStart = focusPeriods[0]?.start;
    const focusEnd = focusPeriods[0]?.end;

    if (!bed_time || !wake_time || !focusStart || !focusEnd) {
      setError("すべての時刻を入力してください。");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedTime: bed_time,
          wakeTime: wake_time,
          focusStart: focusStart,
          focusEnd: focusEnd,
        }),
      });

      if (!response.ok) throw new Error('計算サーバーとの通信に失敗しました。');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // 計算結果をlocalStorageに保存
      localStorage.setItem('caffeinePlanResult', JSON.stringify(data));
      
      // 結果表示ページへ画面遷移
      router.push('../check-state');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-0 flex flex-col">
      {/* ヘッダー：左上アイコン */}
      <header className="w-full flex items-center py-4 mb-8">
        <Link href="../" className="flex items-center">
          <span className="text-2xl sm:text-3xl font-bold text-blue-600 pl-2 cursor-pointer">
            {/* 仮アイコン．作成次第置き換え予定 */}
            📘 Caffe-Run
          </span>
        </Link>
      </header>
      
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

        {/* ★ 変更点：ボタンの動作をonClickに変更 */}
        <div className="w-full flex flex-col items-center justify-center mt-8 mb-6">
          <BlueButton 
            label={isLoading ? '生成中...' : 'カフェイン計画を生成する'} 
            onClick={handleGeneratePlan}
            disabled={isLoading}
          />
          {/* ★ 追加：エラーメッセージの表示エリア */}
          {error && <p className="text-red-500 mt-4 font-semibold">{error}</p>}
        </div>
      </main>
    </div>
  );
};

export default SettingPage;