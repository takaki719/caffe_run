// src/components/NextCaffeineTime.tsx

import React, { useState, useEffect } from "react";

// 型定義を修正
export interface Recommendation {
  time: string;
  caffeineAmount: number;
  fullDateTime: string; // APIからの完全な日時文字列
}

// FocusPeriodの型はそのまま
export interface FocusPeriod {
  start: string;
  end: string;
}

export interface RecommendedPlanListProps {
  recommendations: Recommendation[];
  wakeTime?: string; // 今後の拡張のために残す
  focusPeriods?: FocusPeriod[]; // 今後の拡張のために残す
}

const RecommendedPlanList: React.FC<RecommendedPlanListProps> = ({
  recommendations,
}) => {
  const [validRecs, setValidRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    const filterAndSetRecs = () => {
      const now = new Date();

      // ★★★ ロジックを大幅に簡素化 ★★★
      // APIから渡された日付情報(fullDateTime)を使い、現在時刻より未来の推奨のみをフィルタリング
      const futureRecommendations = recommendations.filter((rec) => {
        if (!rec.fullDateTime) return false; // 日付情報がないものは除外
        const recommendationDate = new Date(rec.fullDateTime);
        return recommendationDate > now;
      });

      // 時刻順にソート（念のため）
      const sortedRecs = futureRecommendations.sort(
        (a, b) =>
          new Date(a.fullDateTime).getTime() -
          new Date(b.fullDateTime).getTime(),
      );

      setValidRecs(sortedRecs);
    };

    filterAndSetRecs(); // 初期表示

    // 1分ごとに更新
    const interval = setInterval(filterAndSetRecs, 60000);

    return () => clearInterval(interval);
  }, [recommendations]); // recommendationsが変更された時のみ再実行

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
