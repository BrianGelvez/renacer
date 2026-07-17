"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getWsBaseUrl } from '@/lib/env';

type Handlers = {
  onNewNotification: (n: any) => void;
  onNotificationRead: (payload: any) => void;
};

export function useNotificationsSocket(userId: string | null, handlers: Handlers) {
  const socketRef = useRef<Socket | null>(null);
  const backendUrl = getWsBaseUrl();

  useEffect(() => {
    if (!userId) return;

    const socket = io(`${backendUrl}/notifications`, {
      transports: ["websocket"],
      withCredentials: true,
      query: { userId },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[notifications] socket connected", { userId });
    });
    socket.on("disconnect", () => {
      console.log("[notifications] socket disconnected", { userId });
    });

    socket.on("new-notification", (n: any) => {
      console.log("[notifications] new-notification received", n?.id);
      handlers.onNewNotification(n);
    });
    socket.on("notification-read", (payload: any) => {
      console.log("[notifications] notification-read received", payload);
      handlers.onNotificationRead(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [backendUrl, handlers, userId]);
}
