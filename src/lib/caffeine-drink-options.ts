/**
 * カフェイン量や1杯あたりの量がドリンクごとに定義されたデータ
 * カフェイン量や1杯あたりの量は適当なので要修正
 */

export interface DrinkOption {
  name: string; // 飲み物名
  defaultMlPerCup: number; // 1杯あたりのml
  caffeineMgPer100ml: number; // 100mlあたりカフェインmg
  cupPresets: number[]; // 選択肢として出す杯数（例：[1,2,3]）
  enableCustomMl?: boolean; // 任意ml入力許可（省略時true扱い）
}

export const DRINK_OPTIONS: DrinkOption[] = [
  {
    name: "コーヒー",
    defaultMlPerCup: 120,
    caffeineMgPer100ml: 67,
    cupPresets: [1, 2, 3], // 「1杯」「2杯」「3杯」
    enableCustomMl: true, // 任意mlも入力可能
  },
  {
    name: "エナジードリンク",
    defaultMlPerCup: 200,
    caffeineMgPer100ml: 40,
    cupPresets: [0.5, 1], // 「半分（0.5杯）」「1本（1杯）」
    enableCustomMl: true,
  },
  // 他も同様
];
