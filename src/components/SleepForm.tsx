"use client";
import React from "react";

export interface SleepFormProps {
  bedTime: string;
  wakeTime: string;
  setBedTime: (t: string) => void;
  setWakeTime: (t: string) => void;
  disabled?: boolean;
}

const SleepForm: React.FC<SleepFormProps> = ({
  bedTime,
  wakeTime,
  setBedTime,
  setWakeTime,
  disabled = false,
}) => (
  <section className="w-full mb-8 mt-8">
    <div className="flex items-center gap-3 w-full">
      <label className="text-gray-600 text-sm font-medium min-w-[95px]">
        睡眠時間
      </label>
      <div className="relative">
        <input
          type="time"
          value={bedTime}
          onChange={(e) => setBedTime(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24 text-black cursor-pointer hover:border-blue-400 transition-colors appearance-none"
          disabled={disabled}
          title="クリックして就寝時刻を変更"
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'textfield'
          }}
          onClick={(e) => {
            e.currentTarget.showPicker?.();
          }}
        />
      </div>
      <span className="text-gray-500">～</span>
      <div className="relative">
        <input
          type="time"
          value={wakeTime}
          onChange={(e) => setWakeTime(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white w-24 text-black cursor-pointer hover:border-blue-400 transition-colors appearance-none"
          disabled={disabled}
          title="クリックして起床時刻を変更"
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'textfield'
          }}
          onClick={(e) => {
            e.currentTarget.showPicker?.();
          }}
        />
      </div>
    </div>
  </section>
);

export default SleepForm;
