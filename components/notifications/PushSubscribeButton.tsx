"use client";

import { useEffect, useState } from "react";

export function PushSubscribeButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator && "PushManager" in window)) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSupported(true);
      setSubscribed(!!sub);
    });
  }, []);

  if (!supported) return null;

  async function subscribe() {
    setLoading(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ).buffer as ArrayBuffer,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (res.ok) {
        setSubscribed(true);
        setMsg("Notifications enabled!");
      } else {
        setMsg("Failed to save subscription.");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error enabling notifications.");
    }
    setLoading(false);
  }

  async function unsubscribe() {
    setLoading(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Notifications disabled.");
    } catch {
      setMsg("Error disabling notifications.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={`rounded-xl border py-3 text-sm font-medium disabled:opacity-50 ${
          subscribed
            ? "border-neutral-200 text-neutral-600"
            : "border-neutral-900 bg-neutral-900 text-white"
        }`}
      >
        {loading ? "..." : subscribed ? "🔕 Disable Notifications" : "🔔 Enable Notifications"}
      </button>
      {msg && <p className="text-xs text-neutral-500">{msg}</p>}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
