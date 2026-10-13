import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

window.isDogHeatNativeApp = () => Capacitor.isNativePlatform();

window.enableNativeDogHeatNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return false;
  const current = await LocalNotifications.checkPermissions();
  let status = current.display;
  if (status !== "granted") {
    const requested = await LocalNotifications.requestPermissions();
    status = requested.display;
  }
  return status === "granted";
};

window.scheduleNativeDogHeatReminders = async (items) => {
  if (!Capacitor.isNativePlatform()) return;
  const allowed = await window.enableNativeDogHeatNotifications();
  if (!allowed) throw new Error("Notification permission not granted");

  // Replace old reminders with the current set, so edits do not leave stale alerts.
  await LocalNotifications.cancelAll();
  if (!items || !items.length) return;

  const notifications = items.map(item => ({
    id: Number(item.id),
    title: String(item.title),
    body: String(item.body),
    schedule: { at: new Date(Number(item.at)), allowWhileIdle: true },
    smallIcon: "ic_launcher",
    channelId: "heat-cycle-reminders",
    autoCancel: true
  }));
  await LocalNotifications.createChannel({
    id: "heat-cycle-reminders",
    name: "Heat-cycle reminders",
    description: "Upcoming dog heat-cycle estimates",
    importance: 4,
    visibility: 1
  });
  await LocalNotifications.schedule({ notifications });
};
