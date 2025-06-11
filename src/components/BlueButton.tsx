// src/components/BlueButton.tsx

import Link from 'next/link';
import React from 'react';

// ★ 変更点1：propsの型定義を修正
interface BlueButtonProps {
  label: string;
  href?: string; // hrefはあってもなくても良い（オプショナル）
  onClick?: () => void; // onClickもオプショナル
  disabled?: boolean; // disabledもオプショナル
  className?: string;
}

const BlueButton: React.FC<BlueButtonProps> = ({
  label,
  href,
  onClick,
  disabled = false,
  className = '',
}) => {
  const baseClasses =
    'w-full px-6 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 transition-colors text-center font-semibold';

  // ★ 変更点2：hrefがあるかどうかで、レンダリングする要素を切り替える
  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${className}`}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
    >
      {label}
    </button>
  );
};

export default BlueButton;