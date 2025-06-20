"use client";
import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { CaffeineLogEntry } from "./CaffeineLogTable";

export interface DashboardProps {
  logs: CaffeineLogEntry[] | null;
  graphData: {
    simulation: { time: string; value: number }[];
    current: { time: string; value: number }[];
  };
  recommendations: { time: string; caffeineAmount: number }[];
  bedTime: string;
  wakeTime: string;
  focusPeriods: { start: string; end: string }[];
}

interface DashboardStatsProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  title,
  value,
  subtitle,
  icon = "📊",
}) => (
  <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-400">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className={`text-2xl font-bold text-gray-800`}>{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({
  logs,
  graphData,
  recommendations,
  bedTime,
  wakeTime,
  focusPeriods,
}) => {
  // アドバイス関連のstate
  const [advice, setAdvice] = useState<string>("");
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string>("");
  const [adviceCount, setAdviceCount] = useState(0);

  // 統計データの計算
  const today = new Date();

  const todayLogs = logs || [];
  const totalCaffeineToday = todayLogs.reduce(
    (sum, log) => sum + (log.caffeineMg || 0),
    0,
  );
  const totalLogsToday = todayLogs.length;

  // 週間統計
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const weeklyLogs = logs || [];

  const averageDailyCaffeine =
    weeklyLogs.length > 0
      ? Math.round(
          weeklyLogs.reduce((sum, log) => sum + (log.caffeineMg || 0), 0) / 7,
        )
      : 0;

  // 睡眠時間計算
  const calculateSleepHours = () => {
    if (!bedTime || !wakeTime) return "未設定";
    const [bedH, bedM] = bedTime.split(":").map(Number);
    const [wakeH, wakeM] = wakeTime.split(":").map(Number);

    const bedMinutes = bedH * 60 + bedM;
    const wakeMinutes = wakeH * 60 + wakeM;

    let sleepMinutes = wakeMinutes - bedMinutes;
    if (sleepMinutes < 0) sleepMinutes += 24 * 60;

    const hours = Math.floor(sleepMinutes / 60);
    const minutes = sleepMinutes % 60;
    return `${hours}時間${minutes}分`;
  };

  // 時間別摂取量グラフ用データ
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourStr = hour.toString().padStart(2, "0");
    const logsInHour = todayLogs.filter((log) => log.time?.startsWith(hourStr));
    const totalInHour = logsInHour.reduce(
      (sum, log) => sum + (log.caffeineMg || 0),
      0,
    );

    return {
      hour: `${hourStr}:00`,
      caffeine: totalInHour,
    };
  }).filter((data) => data.caffeine > 0);

  // パフォーマンス予測サマリー
  const avgSimulationPerformance =
    graphData.simulation.length > 0
      ? Math.round(
          graphData.simulation.reduce((sum, point) => sum + point.value, 0) /
            graphData.simulation.length,
        )
      : 0;

  const avgCurrentPerformance =
    graphData.current.length > 0
      ? Math.round(
          graphData.current.reduce((sum, point) => sum + point.value, 0) /
            graphData.current.length,
        )
      : 0;

  // 推奨実行率計算
  const executedRecommendations = recommendations.filter((rec) => {
    return todayLogs.some((log) => {
      const logTime = log.time?.substring(0, 5);
      const recTime = rec.time;
      return logTime === recTime;
    });
  });

  const executionRate =
    recommendations.length > 0
      ? Math.round(
          (executedRecommendations.length / recommendations.length) * 100,
        )
      : 0;

  // アドバイス生成回数を確認
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const storedAdviceData = localStorage.getItem("daily-advice-count");
    if (storedAdviceData) {
      const data = JSON.parse(storedAdviceData);
      if (data.date === today) {
        setAdviceCount(data.count);
        if (data.advice) {
          setAdvice(data.advice);
        }
      } else {
        // 新しい日なのでリセット
        localStorage.setItem(
          "daily-advice-count",
          JSON.stringify({ date: today, count: 0, advice: "" }),
        );
        setAdviceCount(0);
        setAdvice("");
      }
    } else {
      localStorage.setItem(
        "daily-advice-count",
        JSON.stringify({ date: today, count: 0, advice: "" }),
      );
    }
  }, []);

  // アドバイス生成関数
  const generateAdvice = async () => {
    if (adviceCount >= 10) {
      setAdviceError("今日のアドバイス生成回数の上限（3回）に達しています。");
      return;
    }

    setIsAdviceLoading(true);
    setAdviceError("");

    try {
      const response = await fetch("/api/advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caffeineLogs: logs || [],
          focusPeriods: focusPeriods || [],
          wakeTime: wakeTime || "",
          bedTime: bedTime || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "アドバイス生成に失敗しました");
      }

      const data = await response.json();
      setAdvice(data.advice);

      // ローカルストレージに保存
      const today = new Date().toISOString().split("T")[0];
      const newCount = adviceCount + 1;
      localStorage.setItem(
        "daily-advice-count",
        JSON.stringify({
          date: today,
          count: newCount,
          advice: data.advice,
        }),
      );
      setAdviceCount(newCount);
    } catch (error) {
      console.error("Error generating advice:", error);
      setAdviceError(
        error instanceof Error
          ? error.message
          : "アドバイス生成中にエラーが発生しました",
      );
    } finally {
      setIsAdviceLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">カフェインダッシュボード</h1>
        <p className="text-blue-100">今日のパフォーマンスと摂取状況</p>
        <div className="text-sm text-blue-100 mt-2">
          {today.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </div>
      </div>

      {/* 今日のアドバイス */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-400">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🤖 今日のアドバイス
          </h3>
          <div className="text-sm text-gray-500">{adviceCount}/3回使用</div>
        </div>

        {advice ? (
          <div className="bg-green-50 rounded-lg p-4 mb-3">
            <p className="text-gray-800 leading-relaxed">{advice}</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <p className="text-gray-600">
              アドバイスを生成するボタンを押してください
            </p>
          </div>
        )}

        {adviceError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-red-600 text-sm">{adviceError}</p>
          </div>
        )}

        <button
          onClick={generateAdvice}
          disabled={isAdviceLoading || adviceCount >= 3}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            isAdviceLoading || adviceCount >= 3
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isAdviceLoading
            ? "生成中..."
            : adviceCount >= 10
              ? "本日の上限に達しました"
              : "アドバイスを生成"}
        </button>
      </div>

      {/* 主要指標 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStats
          title="今日のカフェイン摂取量"
          value={`${totalCaffeineToday}mg`}
          subtitle={
            totalCaffeineToday > 400
              ? "摂取量が多めです"
              : totalCaffeineToday < 100
                ? "摂取量が少なめです"
                : "適切な範囲です"
          }
          color={totalCaffeineToday > 400 ? "bg-red-500" : "bg-blue-500"}
          icon="☕"
        />
        <DashboardStats
          title="摂取回数"
          value={`${totalLogsToday}回`}
          subtitle="今日の記録"
          icon="📝"
        />
        <DashboardStats
          title="週平均摂取量"
          value={`${averageDailyCaffeine}mg`}
          subtitle="過去7日間"
          icon="📈"
        />
        <DashboardStats
          title="推奨実行率"
          value={`${executionRate}%`}
          subtitle={`${executedRecommendations.length}/${recommendations.length}件実行`}
          color={
            executionRate >= 80
              ? "bg-green-500"
              : executionRate >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
          }
          icon="🎯"
        />
      </div>

      {/* パフォーマンス比較 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            パフォーマンス予測
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-gray-700">最適化後の平均集中度</span>
              <span className="text-indigo-600 font-bold text-xl">
                {avgSimulationPerformance}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">現状の平均集中度</span>
              <span className="text-gray-600 font-bold text-xl">
                {avgCurrentPerformance}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">改善効果</span>
              <span className="text-green-600 font-bold text-xl">
                +{avgSimulationPerformance - avgCurrentPerformance}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            生活リズム
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">睡眠時間</span>
              <span className="text-blue-600 font-bold">
                {calculateSleepHours()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">就寝時刻</span>
              <span className="text-purple-600 font-bold">
                {bedTime || "未設定"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-gray-700">起床時刻</span>
              <span className="text-yellow-600 font-bold">
                {wakeTime || "未設定"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">集中時間帯</span>
              <span className="text-green-600 font-bold">
                {focusPeriods.length}件設定
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 時間別摂取量グラフ */}
      {hourlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            今日の時間別カフェイン摂取量
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value}mg`, "カフェイン摂取量"]}
                  labelFormatter={(label) => `時刻: ${label}`}
                />
                <Bar dataKey="caffeine" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 今日の推奨スケジュール */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            今日の推奨摂取スケジュール
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec, index) => {
              const isExecuted = executedRecommendations.some(
                (executed) => executed.time === rec.time,
              );
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 ${
                    isExecuted
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg text-gray-800">
                        {rec.time}
                      </div>
                      <div className="text-sm text-gray-600">
                        {rec.caffeineAmount}mg
                      </div>
                    </div>
                    <div className="text-2xl">{isExecuted ? "✅" : "⏰"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
