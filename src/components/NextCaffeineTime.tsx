import React, { useState, useEffect } from "react";

// 変更後のRecommendation型
export interface Recommendation {
  time: string; // "08:00"
  caffeineAmount: number; // 例: 150
}

// 集中時間の型定義
export interface FocusPeriod {
  start: string;
  end: string;
}

/**
 * 起床時間と集中時間を基準に有効な推奨プランのみを返す
 * 以下の条件で推奨プランを表示しない：
 * 1. 起床時間から24時間が経過した場合
 * 2. すべての集中時間が終了した場合
 */
function getValidRecommendations(
  recommendations: Recommendation[],
  wakeTime: string,
  focusPeriods: FocusPeriod[],
  now: Date,
): Recommendation[] {
  if (!wakeTime) return recommendations;

  // "HH:MM"→分に変換
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const wakeMinutes = toMinutes(wakeTime);

  // 起床時間から24時間経過したかをチェック
  let isDayPassed = false;

  if (wakeMinutes <= nowMinutes) {
    // 通常のケース：起床時間が今日の朝など
    const hoursPassed = (nowMinutes - wakeMinutes) / 60;
    isDayPassed = hoursPassed >= 24;
  } else {
    // 日をまたぐケース：起床時間が今日の夜など（前日の起床から計算）
    const minutesSinceYesterdayWake = nowMinutes + 24 * 60 - wakeMinutes;
    const hoursPassed = minutesSinceYesterdayWake / 60;
    isDayPassed = hoursPassed >= 24;
  }

  // 起床時間から24時間が過ぎている場合は空を返す
  if (isDayPassed) {
    return [];
  }

  // 集中時間がすべて終了しているかチェック
  if (focusPeriods && focusPeriods.length > 0) {
    const validFocusPeriods = focusPeriods.filter(
      (period) => period.start && period.end,
    );

    if (validFocusPeriods.length > 0) {
      const allFocusPeriodsEnded = validFocusPeriods.every((period) => {
        let endMinutes = toMinutes(period.end);
        const startMinutes = toMinutes(period.start);

        // 日をまたぐ集中時間の場合（例：22:00-02:00）
        if (startMinutes > endMinutes) {
          endMinutes += 24 * 60; // 翌日の時刻として扱う
          // 現在時刻が午前中（起床時刻より小さい）場合は翌日として扱う必要がある
          const currentTimeForComparison =
            nowMinutes < wakeMinutes ? nowMinutes + 24 * 60 : nowMinutes;
          return currentTimeForComparison > endMinutes;
        } else {
          // 日をまたがない集中時間の場合
          // 現在時刻が起床時刻より小さい場合（翌日）は、集中時間は終了している
          if (nowMinutes < wakeMinutes) {
            return true; // 翌日なので前日の集中時間は終了
          }
          return nowMinutes > endMinutes;
        }
      });

      // すべての集中時間が終了している場合は空を返す
      if (allFocusPeriodsEnded) {
        return [];
      }
    }
  }

  // 現在時刻以降の推奨プランのみを取得
  const futureRecommendations = recommendations.filter(
    (rec) => toMinutes(rec.time) > nowMinutes,
  );

  // 時刻順にソート
  return futureRecommendations.sort(
    (a, b) => toMinutes(a.time) - toMinutes(b.time),
  );
}

export interface RecommendedPlanListProps {
  recommendations: Recommendation[];
  wakeTime?: string;
  focusPeriods?: FocusPeriod[];
}

const RecommendedPlanList: React.FC<RecommendedPlanListProps> = ({
  recommendations,
  wakeTime = "",
  focusPeriods = [],
}) => {
  const [validRecs, setValidRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    // 起床時間と集中時間を基準に有効な推奨プランのみを抽出
    const valid = getValidRecommendations(
      recommendations,
      wakeTime,
      focusPeriods,
      new Date(),
    );
    setValidRecs(valid);

    // 1分ごとに更新して時刻の変化に対応
    const interval = setInterval(() => {
      const updated = getValidRecommendations(
        recommendations,
        wakeTime,
        focusPeriods,
        new Date(),
      );
      setValidRecs(updated);
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [recommendations, wakeTime, focusPeriods]);

  const nextRec = validRecs.length > 0 ? validRecs[0] : null;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2">
      {!nextRec && (
        <div className="text-center text-gray-400 p-4">
          推奨プランがありません
        </div>
      )}
      {nextRec && (
        <div className="bg-white rounded-2xl shadow-md px-3 py-3 flex flex-col gap-2 border-l-4 border-blue-400 mx-auto w-full max-w-xs sm:max-w-sm text-center">
          {/* 時間 */}
          <div className="flex items-center justify-center gap-1 w-full">
            <span className="text-xs text-gray-400">次の摂取は</span>
            <span className="text-blue-600 font-bold text-lg sm:text-xl">
              {nextRec.time}
            </span>
            <span className="text-xs text-gray-400">です</span>
          </div>
          {/* 内容 */}
          <div className="flex items-center justify-center gap-1 w-full">
            <span className="text-gray-800 font-semibold text-sm">
              カフェイン
            </span>
            <span className="text-blue-500 font-bold text-base">
              {nextRec.caffeineAmount}mg
            </span>
            <span className="text-gray-500 text-sm">推奨</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendedPlanList;
