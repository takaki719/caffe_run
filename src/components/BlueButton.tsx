"use client";
import React from "react";
import { useRouter } from "next/navigation";

export interface BlueButtonProps {
  label: string;
  href: string; // 遷移先パス
  onClick?: () => boolean | void | Promise<void>; // 非同期関数にも対応
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean; // disabled プロパティを追加
}

const BlueButton: React.FC<BlueButtonProps> = ({
  label,
  href,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}) => {
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return; // disabledの場合は何もしない

    if (onClick) {
      // onClickがfalseを返したら遷移しない
      const result = await onClick(); // awaitを追加して非同期関数に対応
      if (result === false) {
        e.preventDefault();
        return;
      }
    }

    // hrefが "#" の場合やonClickが非同期処理の場合は遷移しない
    if (href !== "#" && href !== "." && href !== "") {
      router.push(href);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`w-full sm:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md text-base sm:text-lg text-center transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
        disabled ? "opacity-50 cursor-not-allowed hover:bg-blue-500" : ""
      } ${className}`}
    >
      {label}
    </button>
  );
};

export default BlueButton;
