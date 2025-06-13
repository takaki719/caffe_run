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
    name: "ブレンドコーヒー",
    defaultMlPerCup: 200,
    caffeineMgPer100ml: 40,
    cupPresets: [1, 2, 3],
    enableCustomMl: true
  },
  {
    name: "エスプレッソ",
    defaultMlPerCup: 30,
    caffeineMgPer100ml: 212,
    cupPresets: [1, 2, 3],
    enableCustomMl: true
  },
  {
    name: "紅茶",
    defaultMlPerCup: 250,
    caffeineMgPer100ml: 20,
    cupPresets: [1, 2, 3],
    enableCustomMl: true
  },
  {
    name: "緑茶",
    defaultMlPerCup: 250,
    caffeineMgPer100ml: 12,
    cupPresets: [1, 2, 3],
    enableCustomMl: true
  },
  {
    name: "コーラ",
    defaultMlPerCup: 330,
    caffeineMgPer100ml: 10,
    cupPresets: [1, 2, 3],
    enableCustomMl: true
  },
  {
    name: "エナジードリンク",
    defaultMlPerCup: 250,
    caffeineMgPer100ml: 32,
    cupPresets: [1, 2, 3],
    enableCustomMl: true
  }
];
