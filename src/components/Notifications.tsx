import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  CheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  AdminNotification,
  notificationService,
} from "../services/notificationService";

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  const refresh = async () => {
    try {
      const [nextItems, nextUnreadCount] = await Promise.all([
        notificationService.list(),
        notificationService.unreadCount(),
      ]);
      seenIds.current = new Set(nextItems.map((item) => item._id));
      setItems(nextItems);
      setUnreadCount(nextUnreadCount);
    } catch {
      // Keep the shell usable when notifications are unavailable.
    }
  };

  useEffect(() => {
    void refresh();
    const client = notificationService.createRealtimeClient();
    const channel = client.channels.get("notifications:admins");

    const handleNotification = (message: { data?: AdminNotification }) => {
      const next = message.data;
      if (!next?._id || seenIds.current.has(next._id)) return;
      seenIds.current.add(next._id);
      setItems((current) => [next, ...current].slice(0, 30));
      setUnreadCount((count) => count + 1);

      if (
        document.hidden &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(next.title, { body: next.message });
      }
    };

    channel.subscribe("notification", handleNotification);
    const handleConnection = () => {
      if (client.connection.state === "connected") void refresh();
    };
    client.connection.on(handleConnection);

    return () => {
      channel.unsubscribe("notification", handleNotification);
      client.close();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const toggle = async () => {
    setOpen((value) => !value);
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const markRead = async (item: AdminNotification) => {
    if (!item.isRead) {
      await notificationService.markRead(item._id);
      setItems((current) =>
        current.map((entry) =>
          entry._id === item._id ? { ...entry, isRead: true } : entry,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-green-50 hover:text-green-800"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-green-800 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={!unreadCount}
              className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 disabled:text-slate-300"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Read all
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                You are all caught up.
              </div>
            ) : (
              items.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => void markRead(item)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-green-50 ${item.isRead ? "bg-white" : "bg-green-50/60"}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${item.isRead ? "bg-slate-300" : "bg-green-700"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        {item.message}
                      </span>
                      <span className="mt-2 block text-[11px] text-slate-400">
                        {formatTime(item.createdAt)}
                      </span>
                    </span>
                    {!item.isRead && (
                      <CheckIcon className="h-4 w-4 flex-shrink-0 text-green-700" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
