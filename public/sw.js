// --------------------------------------------------
// Service Worker スケジューラー
// --------------------------------------------------

// Service Worker内からIndexedDBを操作するためにidbライブラリを読み込む
importScripts("/idb.js");

// -- 定数 --
const DB_NAME = "caffe-run-db";
const DB_VERSION = 2;
const NOTIFICATION_STORE_NAME = "notificationSchedules";
const NOTIFICATION_TAG = "caffe-run-notification";

// タイマーIDを保持するためのグローバル変数
let timerId = null;

// -- IndexedDB 操作関数 (sw.js内での再定義) --
// データベース接続を開く
const dbPromise = idb.openDB(DB_NAME, DB_VERSION);

/**
 * 次に通知すべきスケジュール（一番時間が近いもの）を1件取得する
 */
const getNextSchedule = async () => {
  const db = await dbPromise;
  const cursor = await db
    .transaction(NOTIFICATION_STORE_NAME)
    .store.openCursor();
  return cursor?.value;
};

/**
 * 指定されたタイムスタンプ（キー）のスケジュールを削除する
 */
const deleteSchedule = async (key) => {
  const db = await dbPromise;
  await db.delete(NOTIFICATION_STORE_NAME, key);
  console.log(`[SW] キー ${key} のスケジュールをIndexedDBから削除しました。`);
};

// -- メインのスケジューリング関数 --

/**
 * 次の通知を予約するメイン関数
 */
const scheduleNextNotification = async () => {
  // 既存のタイマーがあればキャンセル
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }

  // DBから次のスケジュールを取得
  const nextSchedule = await getNextSchedule();

  if (!nextSchedule) {
    console.log("[SW] 通知するスケジュールはありません。");
    return;
  }

  // --- 通知を3分前に出すためのロジック ---
  const NOTIFICATION_LEAD_TIME = 3 * 60 * 1000; // 3分前
  const now = Date.now();
  const scheduledTime = nextSchedule.time;
  const notificationTime = scheduledTime - NOTIFICATION_LEAD_TIME;

  // 通知予定時刻までの残り時間(ミリ秒)を計算
  const delay = notificationTime - now;

  if (delay <= 0) {
    // もし通知予定時刻が過ぎていたら、そのタスクは古いため削除して次のタスクへ
    console.log("[SW] 過ぎたスケジュールを削除します:", nextSchedule);
    await deleteSchedule(scheduledTime);
    // 再帰的に次のスケジュールを予約
    scheduleNextNotification();
    return;
  }

  console.log(
    `[SW] 次の通知を ${Math.round(delay / 1000)}秒後 に予約しました。`,
  );
  console.log(`[SW] 予定: ${new Date(scheduledTime).toLocaleString()}`);

  // タイマーをセット
  timerId = setTimeout(async () => {
    console.log("[SW] 通知を表示します:", nextSchedule);

    // --- 通知の表示 ---
    const title = "もうすぐカフェインの時間です！";
    const options = {
      body: `推奨される摂取量: ${nextSchedule.caffeineAmount}mg`,
      icon: "/caffe-run_icon.png", // 通知アイコン
      badge: "/caffe-run_icon.png", // Androidで表示される小さなアイコン
      tag: NOTIFICATION_TAG, // 同じタグの通知は上書きされる
      renotify: true, // 同じタグでも再通知する
    };

    // self.registration.showNotification は Service Worker のグローバルスコープで利用可能
    await self.registration.showNotification(title, options);

    // 表示済みのスケジュールをDBから削除
    await deleteSchedule(scheduledTime);

    // さらに次のスケジュールのタイマーをセット
    scheduleNextNotification();
  }, delay);
};

// -- Service Worker イベントリスナー --

/**
 * Service Workerがインストールされたとき
 */
self.addEventListener("install", (event) => {
  // 新しいService Workerをすぐに有効化する
  self.skipWaiting();
  console.log("[SW] Service Worker インストール完了");
});

/**
 * Service Workerが有効化されたとき
 * (ブラウザ起動時や、SW更新後に初めて呼ばれる)
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker 有効化完了");
  // 有効化されたら、すぐに次の通知を予約する
  event.waitUntil(scheduleNextNotification());
});

/**
 * Webページからメッセージを受け取ったとき
 */
self.addEventListener("message", (event) => {
  // ページ側からスケジュール更新の通知が来たら、次の通知を再予約する
  if (event.data && event.data.type === "SCHEDULE_UPDATED") {
    console.log("[SW] ページからスケジュール更新通知を受信。再予約します。");
    scheduleNextNotification();
  }
});
