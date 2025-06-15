// components/SettingModal.tsx
"use client";
import React, { useState } from "react";
import SleepForm from "./SleepForm";
import FocusForm from "./FocusForm";
import { useSleepTimes } from "@/hooks/UseSleepTimes";
import { useFocusPeriods } from "@/hooks/UseFocusPeriods";

interface SettingModalProps {
  onClose: () => void;
}

const SettingModal: React.FC<SettingModalProps> = ({ onClose }) => {
  const { bedTime, wakeTime, setBedTime, setWakeTime } = useSleepTimes();
  const { focusPeriods, addFocusPeriod, removeFocusPeriod, updateFocusPeriod } =
    useFocusPeriods([{ start: "09:00", end: "12:00" }], true);

  const [error, setError] = useState("");

  const isValid = () => {
    return (
      !!bedTime && !!wakeTime && focusPeriods.some((p) => p.start && p.end)
    );
  };

  const handleSave = () => {
    if (!isValid()) {
      setError("全ての情報を入力してください");
      return;
    }

    // 保存状態を localStorage で管理
    localStorage.setItem("initial-setup-complete", "true");
    localStorage.setItem("bedTime", bedTime);
    localStorage.setItem("wakeTime", wakeTime);
    localStorage.setItem("focusPeriods", JSON.stringify(focusPeriods));

    // Page.tsxのhooksに変更を通知
    window.dispatchEvent(new CustomEvent("sleepTimesUpdated"));
    window.dispatchEvent(new CustomEvent("focusPeriodsUpdated"));

    setError("");
    onClose(); // モーダルを閉じる
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">初回設定</h2>

        <SleepForm
          bedTime={bedTime}
          wakeTime={wakeTime}
          setBedTime={setBedTime}
          setWakeTime={setWakeTime}
          disabled={false}
        />

        <FocusForm
          focusPeriods={focusPeriods}
          addFocusPeriod={addFocusPeriod}
          removeFocusPeriod={removeFocusPeriod}
          updateFocusPeriod={updateFocusPeriod}
          disabled={false}
        />

        {error && (
          <div className="text-red-600 font-semibold mb-2">{error}</div>
        )}

        <button
          className="mt-4 w-full bg-blue-600 text-white rounded-md py-2 font-semibold"
          onClick={handleSave}
        >
          保存してはじめる
        </button>
      </div>
    </div>
  );
};

export default SettingModal;
