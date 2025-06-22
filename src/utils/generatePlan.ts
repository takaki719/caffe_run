import type { CaffeineLogEntry } from "@/components/CaffeineLogTable";
import type { Recommendation } from "@/components/NextCaffeineTime";

// グラフデータの型
interface GraphPoint {
  time: string;
  value: number;
}

// APIからの生の推奨データ型（API側で返す構造）
interface RawRecommendation {
  time?: string;
  timeDisplay?: string;
  mg?: number;
  caffeineAmount?: number;
  fullDateTime?: string;
}

// APIのレスポンス全体型
interface PlanApiResponse {
  minPerformances?: number[];
  targetPerformance?: number;
  simulationData?: GraphPoint[];
  currentStatusData?: GraphPoint[];
  rawSchedule?: RawRecommendation[];
  caffeinePlan?: RawRecommendation[];
}

export async function generateCaffeinePlan({
  bedTime,
  wakeTime,
  focusPeriods,
  caffeineLogs = [],
}: {
  bedTime: string;
  wakeTime: string;
  focusPeriods: { start: string; end: string }[];
  caffeineLogs?: CaffeineLogEntry[];
}): Promise<{
  minPerformances: number[];
  targetPerformance: number;
  graphData: {
    simulation: GraphPoint[];
    current: GraphPoint[];
  };
  recommendations: Recommendation[];
}> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bed_time: bedTime,
      wake_time: wakeTime,
      focus_periods: focusPeriods,
      caffeine_logs: caffeineLogs,
    }),
  });

  if (!res.ok) throw new Error("API error");

  const json: PlanApiResponse = await res.json();
  const rawRecommendations = json.rawSchedule ?? json.caffeinePlan ?? [];

  const recommendations: Recommendation[] = rawRecommendations.map((rec) => {
    const time = rec.timeDisplay || rec.time || "";
    const now = new Date();
    const [hour, minute] = time.split(":").map(Number);
    const fullDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
    );
    if (fullDate < now) {
      fullDate.setDate(fullDate.getDate() + 1); // 翌日に繰り上げ
    }

    return {
      time,
      caffeineAmount: rec.caffeineAmount ?? rec.mg ?? 0,
      fullDateTime: rec.fullDateTime || fullDate.toISOString(),
    };
  });

  return {
    minPerformances: json.minPerformances || [],
    targetPerformance: json.targetPerformance ?? 0.7,
    graphData: {
      simulation: json.simulationData || [],
      current: json.currentStatusData || [],
    },
    recommendations,
  };
}
