"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Chart from "../../components/Chart";
import { FocusDataPoint } from "../../lib/calcFocusData";
import TopBackButton from "@/components/TopBackButton";

const CheckStatePage: React.FC = () => {
  const [chartData, setChartData] = useState<FocusDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // localStorageから保存されたグラフデータを読み込む
      const savedData = localStorage.getItem("focusData");

      if (savedData) {
        setChartData(JSON.parse(savedData));
      } else {
        setError("計画データが見つかりません。設定ページから計画を生成してください。");
      }
    } catch (err) {
      setError("データの読み込み中にエラーが発生しました。");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-gray-500">グラフを読み込んでいます...</p>;
    }

    if (error) {
      return (
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/setting" className="text-blue-600 hover:underline">
            設定ページに戻る
          </Link>
        </div>
      );
    }

    return <Chart data={chartData} />;
  };

  return (
    <div>
      <TopBackButton />
      <div className="min-h-screen flex flex-col items-center bg-gray-50 px-2 py-8">
        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 mt-10">
          <div className="flex-1 bg-gray-200 rounded-2xl flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] text-gray-500 text-lg font-semibold border-2 border-dashed border-gray-300">
            ここにUnityモデルが入ります
          </div>
          <div className="flex-1 flex items-center justify-center">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckStatePage;