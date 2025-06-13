import React, { useState } from "react";
import { DRINK_OPTIONS, DrinkOption } from "@/lib/CaffeineDrinkOptions";
import CaffeineDrinkSelect from "./CaffeineDrinkSelect";
import CaffeineLogTable, { CaffeineLogEntry } from "./CaffeineLogTable";

/**
 * 飲料名と摂取量を入力するコンポーネント
 *  飲料によって杯数の選択肢やカフェインの含有量が異なるため，これらをセットで管理する
 */

// ドリンク摂取量(ml)からカフェイン摂取量(mg)へ計算する関数
function calcCaffeineMg(drink: DrinkOption, ml: number): number {
  return Math.round((drink.caffeineMgPer100ml * ml) / 100);
}

// カフェイン摂取記録フォームのコンポーネント
const CaffeineLogForm: React.FC = () => {
  // フォームの入力状態（時間、飲料名、入力モード、杯数、ml）
  const [time, setTime] = useState("");
  const [drinkName, setDrinkName] = useState(DRINK_OPTIONS[0].name);
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [cups, setCups] = useState(DRINK_OPTIONS[0].cupPresets[0]);
  const [ml, setMl] = useState(DRINK_OPTIONS[0].defaultMlPerCup);

  // 摂取履歴
  const [logs, setLogs] = useState<CaffeineLogEntry[]>([]);

  // 未入力項目ありメッセージ/登録完了メッセージ
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 現在選択中の飲料データを取得
  const selectedDrink = DRINK_OPTIONS.find((d) => d.name === drinkName)!;
  // 入力値から総摂取mlを計算（何杯or何mlのどちらで入力したかによって計算式が違う）
  const totalMl =
    mode === "preset"
      ? Number(cups) * selectedDrink.defaultMlPerCup
      : Number(ml);

  // 飲料変更時に値をリセット
  const handleDrinkChange = (next: string) => {
    setDrinkName(next);
    const found = DRINK_OPTIONS.find((d) => d.name === next)!;
    setCups(found.cupPresets[0]);
    setMl(found.defaultMlPerCup);
    setMode("preset");
  };

  // 「追加」ボタン押下時に時間が未入力ならエラーメッセージ出力
  const handleAddLog = () => {
    if (!time) {
      setError("摂取時間を入力してください"); //
      setSuccess("");
      return;
    }
    setError("");

    /**
     * カフェイン量の計算→カフェイン摂取量のログ
     * // グラフの描画にかかわってくるのでバックエンドとAPI連携させる必要あり
     */
    const caffeineMg = calcCaffeineMg(selectedDrink, totalMl);
    setLogs((prev) => [
      ...prev,
      {
        time,
        drink: drinkName,
        mode,
        cups: mode === "preset" ? Number(cups) : undefined,
        ml: totalMl,
        caffeineMg,
      },
    ]);
    setTime(""); // 入力欄をリセット

    // 成功メッセージを一時表示
    setSuccess("カフェイン摂取履歴を登録しました");
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white rounded-2xl shadow-md">
      {/* 入力欄グループ */}
      <div className="flex flex-col gap-4 mb-4">
        <div>
          {/* 飲料名・摂取量選択コンポーネント */}
          <CaffeineDrinkSelect
            drinkOptions={DRINK_OPTIONS}
            drink={drinkName}
            mode={mode}
            setMode={setMode}
            cups={cups}
            setCups={setCups}
            ml={ml}
            setMl={setMl}
            onDrinkChange={handleDrinkChange}
          />
        </div>
        <div>
          {/* 摂取時間入力 */}
          <label className="block text-sm text-gray-600 mb-1">摂取時間</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 text-gray-900"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      {/* 追加ボタン */}
      <button
        className="w-full mb-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-xl shadow hover:bg-blue-600 transition"
        onClick={handleAddLog}
        type="button"
      >
        追加
      </button>

      {/* エラー・成功メッセージ表示 */}
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {success && <div className="text-green-600 text-sm mb-2">{success}</div>}

      {/* 履歴テーブル表示 */}
      <CaffeineLogTable logs={logs} />
    </div>
  );
};

export default CaffeineLogForm;
