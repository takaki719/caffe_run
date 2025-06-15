import React, { useState, useEffect } from "react";
import { DRINK_OPTIONS, DrinkOption } from "../lib/CaffeineDrinkOptions";
import CaffeineDrinkSelect from "./CaffeineDrinkSelect";
import CaffeineLogTable, { CaffeineLogEntry } from "./CaffeineLogTable";

/**
 * 飲料名と摂取量を入力するコンポーネント
 *  飲料によって杯数の選択肢やカフェインの含有量が異なるため，これらをセットで管理する
 */

const CAFFEINE_LOGS_STORAGE_KEY = "caffeine-logs";

// ドリンク摂取量(ml)からカフェイン摂取量(mg)へ計算する関数
function calcCaffeineMg(drink: DrinkOption, ml: number): number {
  return Math.round((drink.caffeineMgPer100ml * ml) / 100);
}

// 現在時刻を "HH:MM" 形式で返すユーティリティ関数
function getNowTimeString(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// カフェイン摂取記録フォームのコンポーネント
const CaffeineLogForm: React.FC = () => {
  // フォームの入力状態（時間、飲料名、入力モード、杯数、ml）
  const [time, setTime] = useState(getNowTimeString()); // 現在時刻を初期値に設定
  const [drinkName, setDrinkName] = useState(DRINK_OPTIONS[0].name);
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [cups, setCups] = useState(DRINK_OPTIONS[0].cupPresets[0]);
  const [ml, setMl] = useState(DRINK_OPTIONS[0].defaultMlPerCup);

  // 摂取履歴
  const [logs, setLogs] = useState<CaffeineLogEntry[] | null>(null);

  // 未入力項目ありメッセージ/登録完了メッセージ
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLogs = window.localStorage.getItem(
          CAFFEINE_LOGS_STORAGE_KEY,
        );
        // 読み込んだデータがあればそれを、なければ空配列をセット
        setLogs(savedLogs ? JSON.parse(savedLogs) : []);
      } catch (e) {
        console.error("Failed to load logs from local storage", e);
        setLogs([]); // エラー時も空配列をセット
      }
    }
  }, []);

  useEffect(() => {
    // CHANGED 2: logsがnull（初期状態）でない時だけ保存処理を実行
    if (typeof window !== "undefined" && logs !== null) {
      try {
        window.localStorage.setItem(
          CAFFEINE_LOGS_STORAGE_KEY,
          JSON.stringify(logs),
        );
      } catch (e) {
        console.error("Failed to save logs to local storage", e);
      }
    }
  }, [logs]);

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
      setError("摂取時間を入力してください");
      setSuccess("");
      return;
    }
    setError("");
    const caffeineMg = calcCaffeineMg(selectedDrink, totalMl);
    // logsがnullの場合も考慮して、空配列から始める
    setLogs((prev) => [
      ...(prev || []),
      {
        time,
        drink: drinkName,
        mode,
        cups: mode === "preset" ? Number(cups) : undefined,
        ml: totalMl,
        caffeineMg,
      },
    ]);
    setTime("");
    setSuccess("カフェイン摂取履歴を登録しました");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleDeleteLog = (indexToDelete: number) => {
    setLogs((prev) =>
      prev ? prev.filter((_, index) => index !== indexToDelete) : [],
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white rounded-2xl shadow-md">
      <div className="flex flex-col gap-4 mb-4">
        <div>
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
          <label className="block text-sm text-gray-600 mb-1">摂取時間</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 text-gray-900"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>
      <button
        className="w-full mb-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-xl shadow hover:bg-blue-600 transition"
        onClick={handleAddLog}
        type="button"
      >
        追加
      </button>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {success && <div className="text-green-600 text-sm mb-2">{success}</div>}

      {/* CHANGED 3: logsがnullの場合は空配列を渡すように修正 */}
      <CaffeineLogTable logs={logs || []} onDeleteLog={handleDeleteLog} />
    </div>
  );
};

export default CaffeineLogForm;
