// Notification helpers. Prefers the service-worker registration's
// `showNotification` (required on Android/installed PWAs — `new Notification()`
// throws there), and falls back to a plain Notification on desktop.

export function notifySupported(): boolean {
  return typeof Notification !== "undefined";
}

export function notifyPermission(): NotificationPermission {
  return notifySupported() ? Notification.permission : "denied";
}

export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (!notifySupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export async function showNotification(
  title: string,
  options: NotificationOptions = {},
): Promise<void> {
  if (!notifySupported() || Notification.permission !== "granted") return;
  const opts: NotificationOptions = {
    icon: "/logo.png",
    badge: "/logo.png",
    ...options,
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, opts);
      return;
    }
  } catch {
    /* fall through to the plain Notification path */
  }
  try {
    new Notification(title, opts);
  } catch {
    /* notifications unavailable in this context */
  }
}
