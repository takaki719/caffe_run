import React from "react";
import type { DrinkOption } from "../lib/caffeine-drink-options";

// 親コンポーネントから受け取るpropsの型定義
interface Props {
  drinkOptions: DrinkOption[]; // 選択肢として表示するドリンクデータ一覧
  drink: string; // 選択中の飲料名
  mode: "preset" | "custom"; // 杯数or量(ml)の入力モード
  setMode: (m: "preset" | "custom") => void; // 入力モード変更関数
  cups: number | string; // 選択中の杯数
  setCups: (n: number) => void; // 杯数変更関数
  ml: number; // 量(ml)の値
  setMl: (n: number) => void; // 量(ml)変更関数
  onDrinkChange: (drink: string) => void; // 飲料選択変更ハンドラ
}

// カフェイン摂取飲料＋量選択UI
const CaffeineDrinkSelect: React.FC<Props> = ({
  drinkOptions,
  drink,
  mode,
  setMode,
  cups,
  setCups,
  ml,
  setMl,
  onDrinkChange,
}) => {
  // 現在選択中の飲料オブジェクト取得（未選択時は0番目）
  const selected =
    drinkOptions.find((d) => d.name === drink) || drinkOptions[0];
  // 任意ml入力の可否
  const enableCustom = selected.enableCustomMl !== false;

  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* 飲料名セレクトボックス */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">飲料名</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-400"
          value={drink}
          onChange={(e) => onDrinkChange(e.target.value)}
        >
          {/* 選択肢一覧を動的生成 */}
          <option value="" disabled className="text-gray-400">
            選択してください
          </option>
          {drinkOptions.map((opt) => (
            <option key={opt.name} value={opt.name}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {/* 摂取量の入力欄（プリセット or 任意ml） */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">摂取量</label>
        <div className="flex gap-2">
          {/* 杯数 or 任意ml モード切替ボタン */}
          <button
            type="button"
            className={`px-3 py-1 rounded-l-xl border ${mode === "preset" ? "bg-blue-500 text-white" : "bg-white text-blue-500 border-blue-400"}`}
            onClick={() => setMode("preset")}
          >
            杯数
          </button>
          {enableCustom && (
            <button
              type="button"
              className={`px-3 py-1 rounded-r-xl border-l-0 border ${mode === "custom" ? "bg-blue-500 text-white" : "bg-white text-blue-500 border-blue-400"}`}
              onClick={() => setMode("custom")}
            >
              任意ml
            </button>
          )}
        </div>

        {/* 杯数入力（セレクトボックス） */}
        {mode === "preset" ? (
          <select
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-400"
            value={cups}
            onChange={(e) => setCups(Number(e.target.value))}
          >
            <option value="" disabled className="text-gray-400">
              選択してください
            </option>
            {selected.cupPresets.map((n) => (
              <option key={n} value={n}>
                {n === 0.5 ? "半分" : `${n}杯`}
              </option>
            ))}
          </select>
        ) : (
          // 任意ml入力
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={10}
              step={10}
              className="w-28 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-400"
              value={ml || ""}
              onChange={(e) => setMl(Number(e.target.value))}
              placeholder="入力してください"
            />
            <span className="text-gray-600">ml</span>
          </div>
        )}

        {/* 杯数モードの時に1杯あたりmlを注記表示 */}
        {mode === "preset" && (
          <div className="text-xs text-gray-400 mt-1">
            1杯 = {selected.defaultMlPerCup}ml
          </div>
        )}
      </div>
    </div>
  );
};

export default CaffeineDrinkSelect;
