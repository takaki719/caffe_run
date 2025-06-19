// public/sw.js
self.addEventListener("push", (event) => {
    const data = event.data?.json() ?? {
      title: "Caffe-Run",
      body: "カフェイン摂取の時間です！",
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-192x192.png", // 事前に適切なサイズのアイコンを配置してください
      }),
    );
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            let client = clientList[0];
            for (let i = 0; i < clientList.length; i++) {
              if (clientList[i].focused) {
                client = clientList[i];
              }
            }
            return client.focus();
          }
          return clients.openWindow("/");
        }),
    );
  });