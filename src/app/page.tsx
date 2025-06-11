import React from "react";
import BlueButton from "../components/BlueButton";
import UnityModel from "../components/UnityModel";
import TopBackButton from "@/components/TopBackButton";

const HomePage: React.FC = () => (
  <div>
    <TopBackButton />
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      {/* タイトル */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center text-gray-800 mb-10">
        Caffe-Run
      </h1>
      {/* Unityモデル枠 */}
      <div className="w-full max-w-2xl flex justify-center">
        <UnityModel />
      </div>
      {/* ボタン2つ（モバイル縦並び/PC横並び） */}
      <div className="mt-12" /> {/* ←ここでスペースを追加 */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-10 w-full max-w-lg justify-center items-center">
        <BlueButton label="新しい一日をはじめましょう" href="./setting" />
        <BlueButton label="今日の計画を見る" href="./check-state" />
      </div>
    </div>
  </div>
);

export default HomePage;
