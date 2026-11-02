/**
 * The installable app: register the service worker, tell it where the API
 * is (for notification buttons), and turn push notifications on or off for
 * this device.
 */
import os from "./api";
import { getApiBaseUrl } from "../utils/dashboardApi";

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isMobile = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

/** "iPhone", "Android phone", "Mac", "Windows"… for the devices list. */
export function deviceLabel() {
  const ua = navigator.userAgent;
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
  if (/android/i.test(ua)) return "Android phone";
  if (/mac/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows computer";
  return "This device";
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // Notification buttons post to the API from the service worker; it reads the address from here.
    if ("caches" in window) {
      const c = await caches.open("os-config");
      await c.put("/__config", new Response(JSON.stringify({ api: getApiBaseUrl() }), { headers: { "Content-Type": "application/json" } }));
    }
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

const urlB64 = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Ask permission, subscribe this device, and register it with the backend. */
export async function enablePush(): Promise<{ ok: boolean; message?: string }> {
  if (!pushSupported())
    return {
      ok: false,
      message:
        isIOS() && !isStandalone()
          ? "On iPhone, phone notifications only work from the installed app: add Personal OS to your Home Screen (see above), open it from there, and turn them on in its Settings."
          : "This browser can't get phone notifications. Install the app on your phone (see above) and turn them on from there.",
    };
  const keyRes = await os.get("/push/key");
  if (!keyRes.data.configured) return { ok: false, message: "Phone notifications aren't set up on the server yet: add the VAPID keys to the backend's config vars." };
  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    return {
      ok: false,
      message: isIOS()
        ? "Notifications are blocked for the Personal OS app. Allow them in your iPhone's Settings → Notifications → Personal OS, then try again."
        : "Notifications are blocked for the Personal OS app. Allow them in your phone's Settings → Apps → Personal OS (or Chrome) → Notifications, then try again.",
    };
  const reg = (await navigator.serviceWorker.getRegistration()) || (await registerServiceWorker());
  if (!reg) return { ok: false, message: "Couldn't start the installed app's background worker. Close the app fully, reopen it from your home screen and try again." };
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(keyRes.data.publicKey) }));
  await os.post("/push/subscribe", { subscription: sub.toJSON(), label: deviceLabel() });
  return { ok: true };
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await os.delete("/push/devices/this", { data: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

// Android/desktop Chrome offer an install prompt; keep it for an "Install app" button.
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let installEvent: InstallPrompt | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvent = e as InstallPrompt;
  });
}
export const canPromptInstall = () => Boolean(installEvent);
export async function promptInstall() {
  if (!installEvent) return false;
  await installEvent.prompt();
  const choice = await installEvent.userChoice;
  installEvent = null;
  return choice.outcome === "accepted";
}
