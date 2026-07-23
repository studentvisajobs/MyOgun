"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  channel:
    | "GUARDIAN"
    | "COMMUNITY"
    | "POLICE"
    | "EMERGENCY";
  isRead: boolean;
  incidentId: string | null;
  journeyId: string | null;
  emergencyId: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

function formatNotificationTime(
  dateValue: string
) {
  const date = new Date(dateValue);
  const difference =
    Date.now() - date.getTime();

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString();
}

function getChannelIcon(
  channel: NotificationItem["channel"]
) {
  switch (channel) {
    case "GUARDIAN":
      return "🛡️";
    case "COMMUNITY":
      return "📍";
    case "POLICE":
      return "🚓";
    case "EMERGENCY":
      return "🚨";
    default:
      return "🔔";
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const containerRef =
    useRef<HTMLDivElement>(null);

  const loadNotifications =
    useCallback(async () => {
      try {
        const response = await fetch(
          "/api/notifications",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          setNotifications([]);
          setUnreadCount(0);
          return;
        }

        const data =
          (await response.json()) as
            | NotificationsResponse
            | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in data
              ? data.error
              : "Unable to load notifications."
          );
        }

        if (
          "notifications" in data &&
          "unreadCount" in data
        ) {
          setNotifications(
            data.notifications
          );

          setUnreadCount(
            data.unreadCount
          );
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load notifications."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(
      () => {
        void loadNotifications();
      },
      30000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  async function markAsRead(
    notificationId: string
  ) {
    const notification =
      notifications.find(
        (item) =>
          item.id === notificationId
      );

    if (!notification || notification.isRead) {
      return;
    }

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to mark notification as read."
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update notification."
      );
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    try {
      const response = await fetch(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to mark notifications as read."
        );
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update notifications."
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.311 6.022 23.848 23.848 0 0 0 5.454 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-black text-white">
                Notifications
              </h2>

              <p className="text-xs text-white/50">
                {unreadCount} unread
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  void markAllAsRead()
                }
                className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
              >
                Mark all as read
              </button>
            )}
          </div>

          {message && (
            <div className="border-b border-white/10 bg-red-500/10 px-5 py-3 text-xs text-red-300">
              {message}
            </div>
          )}

          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-white/50">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mb-2 text-3xl">
                  🔔
                </div>

                <p className="font-bold text-white">
                  No notifications
                </p>

                <p className="mt-1 text-sm text-white/50">
                  Safety updates will appear
                  here.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      void markAsRead(
                        notification.id
                      )
                    }
                    className={`flex w-full gap-3 border-b border-white/5 px-5 py-4 text-left transition last:border-b-0 hover:bg-white/5 ${
                      notification.isRead
                        ? "bg-transparent"
                        : "bg-emerald-500/5"
                    }`}
                  >
                    <span className="mt-0.5 text-xl">
                      {getChannelIcon(
                        notification.channel
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span
                          className={`text-sm text-white ${
                            notification.isRead
                              ? "font-semibold"
                              : "font-black"
                          }`}
                        >
                          {
                            notification.title
                          }
                        </span>

                        {!notification.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                        )}
                      </span>

                      <span className="mt-1 block text-sm leading-5 text-white/60">
                        {
                          notification.message
                        }
                      </span>

                      <span className="mt-2 block text-xs font-semibold text-white/35">
                        {formatNotificationTime(
                          notification.createdAt
                        )}
                      </span>
                    </span>
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}