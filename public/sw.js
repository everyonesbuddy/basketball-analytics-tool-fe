/* Personal OS service worker: receives push notifications, handles their
 * buttons, and keeps a copy of the app shell for when the network drops. */
const SHELL = "os-shell-v1";
const CONFIG = "os-config";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.add("/")).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("os-shell-") && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Pages: network first (always the latest deploy), the saved shell if offline.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put("/", copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match("/")),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Personal OS", body: event.data ? event.data.text() : "" };
  }
  const options = {
    body: data.body || "",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    icon: "/icons/icon-192.png",
    badge: "/icons/favicon-32.png",
    data: { url: data.url || "/", actionToken: data.actionToken || null },
    actions: (data.actions || []).slice(0, 2),
  };
  event.waitUntil(self.registration.showNotification(data.title || "Personal OS", options));
});

async function apiBase() {
  try {
    const res = await caches.open(CONFIG).then((c) => c.match("/__config"));
    if (res) return (await res.json()).api || "";
  } catch {
    // fall through
  }
  return "";
}

async function openApp(url) {
  const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const c of all) {
    if ("focus" in c) {
      await c.focus();
      if ("navigate" in c) await c.navigate(url).catch(() => {});
      return;
    }
  }
  await self.clients.openWindow(url);
}

self.addEventListener("notificationclick", (event) => {
  const n = event.notification;
  const { url, actionToken } = n.data || {};
  n.close();
  // Buttons on a check-in (Android): log it without opening the app.
  if ((event.action === "progress" || event.action === "cleared") && actionToken) {
    event.waitUntil(
      apiBase().then((api) =>
        fetch(`${api}/os/push/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: actionToken, action: event.action }) })
          .then((r) =>
            self.registration.showNotification(r.ok ? (event.action === "cleared" ? "Cleared for this period" : "Moved it forward today") : "Couldn't check in", {
              body: r.ok ? "Logged. On to the next one." : "Open the app to check in.",
              tag: "checkin-result",
              icon: "/icons/icon-192.png",
            }),
          )
          .catch(() => openApp("/")),
      ),
    );
    return;
  }
  event.waitUntil(openApp(url || "/"));
});
