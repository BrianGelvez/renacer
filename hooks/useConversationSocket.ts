"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getWsBaseUrl } from '@/lib/env';

type NewMessageHandler = (msg: unknown) => void;
type ConversationUpdateHandler = (conversation: unknown) => void;

export function useConversationSocket(
  conversationId: string | null,
  onNewMessage: NewMessageHandler,
  onConversationUpdated?: ConversationUpdateHandler,
) {
  const socketRef = useRef<Socket | null>(null);
  const backendUrl = getWsBaseUrl();

  useEffect(() => {
    if (!conversationId && !onConversationUpdated) return;

    if (!socketRef.current) {
      socketRef.current = io(backendUrl, {
        transports: ["websocket"],
        withCredentials: true,
      });
    }

    const socket = socketRef.current;
    if (conversationId) {
      socket.emit("join", conversationId);
    }

    const handler = (msg: unknown) => onNewMessage(msg);
    const conversationHandler = (conversation: unknown) =>
      onConversationUpdated?.(conversation);

    if (conversationId) {
      socket.on("new_message", handler);
    }
    if (onConversationUpdated) {
      socket.on("conversation_updated", conversationHandler);
    }

    return () => {
      socket.off("new_message", handler);
      socket.off("conversation_updated", conversationHandler);
    };
  }, [backendUrl, conversationId, onNewMessage, onConversationUpdated]);
}
