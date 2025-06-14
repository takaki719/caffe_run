import React from "react";
import Link from "next/link";

const TopBackButton: React.FC = () => (
  <header className="w-full flex items-center py-4">
    <Link href="../" className="flex items-center">
      <span className="text-2xl sm:text-3xl font-bold text-blue-600 pl-2 cursor-pointer">
        {/* 仮アイコン．作成次第置き換え予定 */}
        ☕️ Caffe-Run
      </span>
    </Link>
  </header>
);

export default TopBackButton;
