export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface GraphData {
  simulation: Array<{ time: string; value: number }>;
  current: Array<{ time: string; value: number }>;
}
