import { NextResponse } from "next/server";
import type { CaffeineLogEntry } from "@/components/CaffeineLogTable";

interface FocusPeriod {
  start: string;
  end: string;
}

interface AdviceRequest {
  caffeineLogs: CaffeineLogEntry[];
  focusPeriods: FocusPeriod[];
  wakeTime: string;
  bedTime: string;
}

// アドバイス生成制限の管理（メモリベース）
interface AdviceRateLimit {
  count: number;
  lastDate: string;
}

const adviceRateLimits = new Map<string, AdviceRateLimit>();

function checkRateLimit(): boolean {
  const today = new Date().toISOString().split("T")[0];
  const userId = "default"; // 単一ユーザーなので固定

  const current = adviceRateLimits.get(userId);

  if (!current || current.lastDate !== today) {
    // 新しい日または初回アクセス
    adviceRateLimits.set(userId, { count: 1, lastDate: today });
    return true;
  }

  if (current.count >= 10) {
    return false; // 1日3回制限に達している
  }

  current.count++;
  return true;
}

function generateMockAdvice(data: AdviceRequest): string {
  const { caffeineLogs, focusPeriods, wakeTime, bedTime } = data;

  // カフェイン摂取量の計算
  const totalCaffeine = caffeineLogs.reduce(
    (sum, log) => sum + log.caffeineMg,
    0,
  );

  // 睡眠時間の計算
  const calculateSleepHours = (bedTime: string, wakeTime: string): number => {
    const [bedH, bedM] = bedTime.split(":").map(Number);
    const [wakeH, wakeM] = wakeTime.split(":").map(Number);

    const bedMinutes = bedH * 60 + bedM;
    const wakeMinutes = wakeH * 60 + wakeM;

    let sleepMinutes = wakeMinutes - bedMinutes;
    if (sleepMinutes < 0) sleepMinutes += 24 * 60;

    return sleepMinutes / 60;
  };

  const sleepHours = calculateSleepHours(bedTime, wakeTime);

  // モックアドバイスの生成ロジック
  const adviceTemplates = [
    // カフェイン量に基づくアドバイス
    ...(totalCaffeine > 400
      ? [
          "今日のカフェイン摂取量が多めですね。午後は水分補給を心がけ、夕方以降のカフェインは控えめにしましょう。",
          "カフェイン摂取量が多いので、明日は少し控えめにして体を休ませてあげてください。",
        ]
      : totalCaffeine < 100
        ? [
            "カフェイン摂取量が少なめです。集中したい時間の30分前に適量のカフェインを摂取すると効果的です。",
            "カフェイン不足かもしれません。コーヒー1杯程度のカフェイン補給で集中力がアップするかもしれません。",
          ]
        : [
            "カフェイン摂取量は適切な範囲ですね。このペースを維持して集中力を最大化しましょう。",
            "バランスの良いカフェイン摂取ができています。タイミングを意識してさらに効果を高めましょう。",
          ]),

    // 睡眠時間に基づくアドバイス
    ...(sleepHours < 6
      ? [
          "睡眠時間が短めです。カフェインに頼りすぎず、可能な時に仮眠を取ることをおすすめします。",
          "睡眠不足気味ですね。カフェインの効果を最大化するためにも、今夜は早めの就寝を心がけましょう。",
        ]
      : sleepHours > 9
        ? [
            "十分な睡眠が取れていますね。自然な集中力を活かして、カフェインは必要最小限に抑えましょう。",
            "良質な睡眠のおかげで基礎体力が整っています。カフェインを戦略的に使って更なる集中力向上を目指しましょう。",
          ]
        : [
            "睡眠時間は理想的ですね。この調子で規則正しい生活リズムを維持しましょう。",
            "バランスの取れた睡眠ができています。カフェイン摂取との相乗効果で最高のパフォーマンスを発揮しましょう。",
          ]),

    // 集中時間に基づくアドバイス
    ...(focusPeriods.length > 3
      ? [
          "集中時間が多く設定されていますね。各セッションの間に適度な休憩を取り、持続可能なペースを心がけましょう。",
          "多くの集中時間をお疲れ様です。カフェインの効果時間を考慮して、戦略的に摂取タイミングを調整しましょう。",
        ]
      : [
          "集中時間に合わせたカフェイン摂取で、効率的な作業ができそうですね。",
          "計画的な集中時間の設定ですね。カフェインの効果を最大限活用して成果を上げましょう。",
        ]),

    // 一般的なアドバイス
    "水分補給も忘れずに。カフェインと水分のバランスが集中力維持の鍵です。",
    "カフェインの効果は人それぞれです。自分の体調と相談しながら最適な量を見つけましょう。",
    "定期的な軽い運動も集中力向上に効果的です。カフェインと合わせて取り入れてみてください。",
    "今日も一日お疲れ様です。計画的なカフェイン摂取で効率的な時間を過ごしましょう。",
  ];

  // ランダムにアドバイスを選択
  const randomIndex = Math.floor(Math.random() * adviceTemplates.length);
  return adviceTemplates[randomIndex];
}

async function generateRealAdvice(data: AdviceRequest): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-mock")) {
    // モック環境の場合
    return generateMockAdvice(data);
  }

  try {
    const { caffeineLogs, focusPeriods, wakeTime, bedTime } = data;

    // カフェイン摂取量の計算
    const totalCaffeine = caffeineLogs.reduce(
      (sum, log) => sum + log.caffeineMg,
      0,
    );

    // 睡眠時間の計算
    const calculateSleepHours = (bedTime: string, wakeTime: string): number => {
      const [bedH, bedM] = bedTime.split(":").map(Number);
      const [wakeH, wakeM] = wakeTime.split(":").map(Number);

      const bedMinutes = bedH * 60 + bedM;
      const wakeMinutes = wakeH * 60 + wakeM;

      let sleepMinutes = wakeMinutes - bedMinutes;
      if (sleepMinutes < 0) sleepMinutes += 24 * 60;

      return sleepMinutes / 60;
    };

    const sleepHours = calculateSleepHours(bedTime, wakeTime);

    const prompt = `
あなたは集中力とカフェイン摂取の専門家です。以下のデータを基に、1行以内の簡潔で実用的なアドバイスを日本語で提供してください。

【今日のデータ】
- カフェイン総摂取量: ${totalCaffeine}mg
- 摂取回数: ${caffeineLogs.length}回
- 睡眠時間: ${sleepHours.toFixed(1)}時間 (${bedTime}〜${wakeTime})
- 集中時間設定: ${focusPeriods.length}件

【制約】
- 50文字以内で簡潔に
- 具体的で実行可能なアドバイス
- 親しみやすい口調で
- カフェインと集中力に関連した内容
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "あなたは集中力向上の専門家です。簡潔で実用的なアドバイスを提供してください。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || generateMockAdvice(data);
  } catch (error) {
    console.error("Error generating advice:", error);
    return generateMockAdvice(data);
  }
}

export async function POST(request: Request) {
  try {
    // レート制限チェック
    if (!checkRateLimit()) {
      return NextResponse.json(
        {
          error:
            "今日のアドバイス生成回数の上限（3回）に達しています。明日また試してください。",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { caffeineLogs, focusPeriods, wakeTime, bedTime } = body;

    // バリデーション
    if (!caffeineLogs || !focusPeriods || !wakeTime || !bedTime) {
      return NextResponse.json(
        { error: "必要なデータが不足しています" },
        { status: 400 },
      );
    }

    const advice = await generateRealAdvice({
      caffeineLogs,
      focusPeriods,
      wakeTime,
      bedTime,
    });

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("Advice API Error:", error);
    return NextResponse.json(
      { error: "アドバイス生成中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
