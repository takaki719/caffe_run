// src/lib/local-db.ts
import { openDB, DBSchema } from "idb";

const DB_NAME = "caffe-run-db";
const DB_VERSION = 2;
const NOTIFICATION_STORE_NAME = "notificationSchedules";

interface CaffeRunDB extends DBSchema {
  [NOTIFICATION_STORE_NAME]: {
    key: number;
    value: {
      time: number;
      caffeineAmount: number;
    };
  };
}

// ★ 修正点: ブラウザ環境でのみDB接続を試みるようにする
const dbPromise =
  typeof window !== "undefined"
    ? openDB<CaffeRunDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          db.createObjectStore(NOTIFICATION_STORE_NAME);
        },
      })
    : null;

/**
 * 通知スケジュールをクリア（全件削除）する
 */
export const clearSchedules = async () => {
  if (!dbPromise) return; // ★ 修正点: サーバーサイドでは何もしない
  const db = await dbPromise;
  await db.clear(NOTIFICATION_STORE_NAME);
  console.log("IndexedDBのスケジュールをクリアしました。");
};

/**
 * 複数の通知スケジュールをまとめて保存する
 * @param schedules - 保存するスケジュールの配列
 */
export const saveSchedules = async (
  schedules: { time: number; caffeineAmount: number }[],
) => {
  if (!dbPromise) return; // ★ 修正点: サーバーサイドでは何もしない
  const db = await dbPromise;
  const tx = db.transaction(NOTIFICATION_STORE_NAME, "readwrite");
  await Promise.all(
    schedules.map((schedule) => tx.store.put(schedule, schedule.time)),
  );
  await tx.done;
  console.log(`${schedules.length}件のスケジュールをIndexedDBに保存しました。`);
};

/**
 * 次に通知すべきスケジュール（一番時間が近いもの）を1件取得する
 * @returns {Promise<{ time: number; caffeineAmount: number } | undefined>}
 */
export const getNextSchedule = async () => {
  if (!dbPromise) return undefined; // ★ 修正点: サーバーサイドでは何もしない
  const db = await dbPromise;
  const cursor = await db
    .transaction(NOTIFICATION_STORE_NAME)
    .store.openCursor();
  return cursor?.value;
};

/**
 * 指定されたタイムスタンプ（キー）のスケジュールを削除する
 * @param key - 削除するスケジュールのタイムスタンプ
 */
export const deleteSchedule = async (key: number) => {
  if (!dbPromise) return; // ★ 修正点: サーバーサイドでは何もしない
  const db = await dbPromise;
  await db.delete(NOTIFICATION_STORE_NAME, key);
  console.log(`キー ${key} のスケジュールをIndexedDBから削除しました。`);
};
