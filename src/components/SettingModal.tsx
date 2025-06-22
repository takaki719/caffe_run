"use client";
import React, { useState } from "react";
import SleepForm from "./SleepForm";
import FocusForm from "./FocusForm";
import { useSleepTimes } from "@/hooks/UseSleepTimes";
import { useFocusPeriods } from "@/hooks/UseFocusPeriods";
import { generateCaffeinePlan } from "@/utils/generatePlan";

interface GraphData {
  simulation: SimulationPoint[];
  current: SimulationPoint[];
}

interface SimulationPoint {
  time: string;
  value: number;
}

interface ProcessedRecommendation {
  time: string;
  caffeineAmount: number;
}

interface SettingModalProps {
  onClose: (
    minPerformances: number[],
    targetPerformance: number,
    graphData?: GraphData,
    recommendations?: ProcessedRecommendation[],
  ) => void;
}

const SettingModal: React.FC<SettingModalProps> = ({ onClose }) => {
  const { bedTime, wakeTime, setBedTime, setWakeTime } = useSleepTimes();
  const { focusPeriods, addFocusPeriod, removeFocusPeriod, updateFocusPeriod } =
    useFocusPeriods([{ start: "09:00", end: "12:00" }], true);

  const [error, setError] = useState("");

  const isValid = () =>
    !!bedTime &&
    !!wakeTime &&
    bedTime !== "" &&
    wakeTime !== "" &&
    focusPeriods.some(
      (p) => p.start && p.end && p.start !== "" && p.end !== "",
    );
  focusPeriods.some((p) => p.start && p.end && p.start !== "" && p.end !== "");

  const handleSave = async () => {
    if (!isValid()) {
      setError("全ての情報を入力してください");
      return;
    }

    localStorage.setItem("initial-setup-complete", "true");
    localStorage.setItem("bedTime", bedTime);
    localStorage.setItem("wakeTime", wakeTime);
    localStorage.setItem("focusPeriods", JSON.stringify(focusPeriods));
    window.dispatchEvent(new CustomEvent("sleepTimesUpdated"));
    window.dispatchEvent(new CustomEvent("focusPeriodsUpdated"));

    try {
      const { minPerformances, targetPerformance, graphData, recommendations } =
        await generateCaffeinePlan({
          bedTime,
          wakeTime,
          focusPeriods,
          caffeineLogs: [],
        });

      setError("");
      onClose(minPerformances, targetPerformance, graphData, recommendations);
    } catch (err) {
      setError("初期プラン取得中にエラーが発生しました");
      console.error("Error generating caffeine plan:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center text-black">
          初回設定
        </h2>

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

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <button
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
          onClick={handleSave}
        >
          保存してはじめる
        </button>
      </div>
    </div>
  );
};

export default SettingModal;
