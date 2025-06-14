import { useState } from "react";

export interface FocusPeriod {
  start: string;
  end: string;
}

/**
 * フォーカス時間帯を管理するカスタムフック
 */
export function useFocusPeriods(initial?: FocusPeriod[]) {
  const [periods, setPeriods] = useState<FocusPeriod[]>(
    initial ?? [{ start: "", end: "" }]
  );

  /** 新しいフォーカス時間帯を追加 */
  const addFocusPeriod = () => {
    setPeriods((prev) => [...prev, { start: "", end: "" }]);
  };

  /** インデックス指定で時間帯を削除 */
  const removeFocusPeriod = (index: number) => {
    setPeriods((prev) => prev.filter((_, i) => i !== index));
  };

  /** インデックスとキーを指定して時間帯を更新 */
  const updateFocusPeriod = (
    index: number,
    key: "start" | "end",
    value: string
  ) => {
    setPeriods((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    );
  };

  return {
    focusPeriods: periods,
    addFocusPeriod,
    removeFocusPeriod,
    updateFocusPeriod,
  };
}
