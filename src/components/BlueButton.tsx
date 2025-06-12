"use client";
import React from "react";
import { useRouter } from "next/navigation";

export interface BlueButtonProps {
  label: string;
  href: string; // 遷移先パス
  onClick?: () => boolean | void; // 戻り値がfalseなら遷移しない
  type?: "button" | "submit" | "reset";
  className?: string;
}

const BlueButton: React.FC<BlueButtonProps> = ({
  label,
  href,
  onClick,
  type = "button",
  className = "",
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      // onClickがfalseを返したら遷移しない
      const result = onClick();
      if (result === false) {
        e.preventDefault();
        return;
      }
    }
    router.push(href);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      className={
        "w-full sm:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md text-base sm:text-lg text-center transition focus:outline-none focus:ring-2 focus:ring-blue-400 " +
        className
      }
    >
      {label}
    </button>
  );
};

export default BlueButton;
