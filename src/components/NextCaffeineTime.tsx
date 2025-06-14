import React, { useState, useEffect } from "react";

// 変更後のRecommendation型
export interface Recommendation {
  time: string; // "08:00"
  caffeineAmount: number; // 例: 150
}

/**
 * 現在時刻から最も近い順でローテーション表示
 * 例：現在時刻が15:00の場合
 * 16:00→20:00→08:00→12:00
 */
function getSortedByCurrentTime(
  recommendations: Recommendation[],
  now: Date,
): Recommendation[] {
  // "HH:MM"→分に変換
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // 今以降→今より前、で結合
  const after = recommendations.filter(
    (rec) => toMinutes(rec.time) >= nowMinutes,
  );
  const before = recommendations.filter(
    (rec) => toMinutes(rec.time) < nowMinutes,
  );
  // 昇順で並べてから、結合
  const sortByTime = (a: Recommendation, b: Recommendation) =>
    toMinutes(a.time) - toMinutes(b.time);
  return [...after.sort(sortByTime), ...before.sort(sortByTime)];
}

export interface RecommendedPlanListProps {
  recommendations: Recommendation[];
}

const RecommendedPlanList: React.FC<RecommendedPlanListProps> = ({
  recommendations,
}) => {
  const [sortedRecs, setSortedRecs] = useState(recommendations);

  useEffect(() => {
    // この中身は、ブラウザ(クライアント)での最初の描画が終わった後に一度だけ実行される
    const sorted = getSortedByCurrentTime(recommendations, new Date());
    setSortedRecs(sorted); // 並び替えた結果をstateにセット
  }, [recommendations]); // recommendationsプロパティが変わった時に再実行

  const nextRec = sortedRecs.length > 0 ? sortedRecs[0] : null;

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
