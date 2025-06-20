"use client";
import React from "react";

interface ExpirePopupProps {
  onClose: () => void;
}

const ExpirePopup: React.FC<ExpirePopupProps> = ({ onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50">
      <div className="flex items-center justify-between gap-4">
        <span>古いカフェイン記録が削除されました</span>
        <button onClick={onClose} className="text-white font-bold text-lg">
          ×
        </button>
      </div>
    </div>
  );
};

export default ExpirePopup;
