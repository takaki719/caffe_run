// components/blue-button.tsx
import React from "react";
import Link from "next/link";

export interface BlueButtonProps {
  label: string;
  href: string;
}

const BlueButton: React.FC<BlueButtonProps> = ({ label, href }) => (
  <Link
    href={href}
    className="
      inline-block
      w-full sm:w-auto
      px-6 py-2
      bg-blue-500 hover:bg-blue-600
      text-white font-semibold
      rounded-xl shadow-md
      text-base sm:text-lg
      text-center
      transition
      focus:outline-none focus:ring-2 focus:ring-blue-400
    "
  >
    {label}
  </Link>
);

export default BlueButton;
