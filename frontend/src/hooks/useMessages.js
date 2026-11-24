import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { fetchCurrentUser } from "../api/authApi";
import {
  fetchConversations,
  fetchConversationDetail,
  openOrCreateConversation,
  markConversationAsRead,
  createDirectMessage,
  updateDirectMessage,
  deleteDirectMessage,
} from "../api/messageApi";
import {
  NOTIFICATION_EVENTS,
  emitNotificationsUpdated,
} from "../constants/notificationConstants";
import { SOCKET_EVENTS } from "../constants/messageConstants";

function sortConversationsByUpdated(list) {
  return [...list].sort(
    (a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0)
  );
}

function upsertConversation(list, updatedConv) {
  if (!updatedConv) return list;
  const exists = list.some((c) => c.id === updatedConv.id);
  const next = exists
    ? list.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    : [updatedConv, ...list];
  return sortConversationsByUpdated(next);
}

export function useMessages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draftsByConversation, setDraftsByConversation] = useState({});
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [processingMessageId, setProcessingMessageId] = useState("");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  const socketRef = useRef(null);
  const selectedIdRef = useRef("");
  const deepLinkHandledRef = useRef(false);

  const userId = currentUser?.id;

  useEffect(() => {
    selectedIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    let active = true;

    const handleUserChanged = (e) => {
      const nextUser = e.detail || null;
      setCurrentUser(nextUser);
      setError("");
      setErrorStatus(null);
      if (!nextUser) {
        setConversations([]);
        setSelectedConversationId("");
        setActiveConversation(null);
        setMessages([]);
        setDraftsByConversation({});
      }
    };

    window.addEventListener(
      NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
      handleUserChanged
    );

    fetchCurrentUser()
      .then((nextUser) => {
        if (active) setCurrentUser(nextUser);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });

    return () => {
      active = false;
      window.removeEventListener(
        NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED,
        handleUserChanged
      );
    };
  }, []);

  const selectConversation = useCallback(async (conversationId) => {
    await Promise.resolve();
    setFeedbackBanner(null);

    if (!conversationId) {
      setSelectedConversationId("");
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    setSelectedConversationId(String(conversationId));
    setThreadLoading(true);
    setError("");
    setErrorStatus(null);

    try {
      const data = await fetchConversationDetail(conversationId);
      setActiveConversation(data.conversation || null);
      setMessages(data.messages || []);
      if (data.conversation) {
        setConversations((prev) => upsertConversation(prev, data.conversation));
      }
      emitNotificationsUpdated();
    } catch (err) {
      setError(err.message || "대화 내역을 불러오지 못했습니다.");
      setErrorStatus(err.status || null);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const clearSelectedConversation = useCallback(() => {
    setSelectedConversationId("");
    setActiveConversation(null);
    setMessages([]);
    setFeedbackBanner(null);
  }, []);

  const setDraft = useCallback((conversationId, value) => {
    if (!conversationId) return;
    setDraftsByConversation((prev) => ({
      ...prev,
      [String(conversationId)]: value,
    }));
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    let active = true;

    const initMessages = async () => {
      await Promise.resolve();
      if (!active) return;

      if (!userId) {
        setLoading(false);
        setErrorStatus(401);
        return;
      }

      setLoading(true);
      setError("");
      setErrorStatus(null);

      try {
        const params = new URLSearchParams(window.location.search);
        const targetRecipientId = params.get("to")?.trim() || "";
        const targetPostId = params.get("postId")?.trim() || "";
        const targetConversationId = params.get("conversationId")?.trim() || "";

        let targetConvId = targetConversationId;

        if (
          !deepLinkHandledRef.current &&
          targetRecipientId &&
          targetRecipientId !== String(userId)
        ) {
          deepLinkHandledRef.current = true;
          try {
            const openRes = await openOrCreateConversation({
              recipientId: targetRecipientId,
              postId: targetPostId,
            });
            if (!active) return;
            targetConvId = openRes.conversation?.id || targetConvId;
            window.history.replaceState(null, "", window.location.pathname);
          } catch (openErr) {
            if (!active) return;
            setFeedbackBanner({
              type: "error",
              message: openErr.message || "대화방을 열지 못했습니다.",
            });
          }
        } else if (!deepLinkHandledRef.current && targetConversationId) {
          deepLinkHandledRef.current = true;
          window.history.replaceState(null, "", window.location.pathname);
        }

        const listData = await fetchConversations();
        if (!active) return;
        const convList = listData.conversations || [];
        setConversations(convList);

        const initialId = targetConvId || selectedIdRef.current || "";

        if (initialId) {
          await selectConversation(initialId);
        } else {
          setSelectedConversationId("");
          setActiveConversation(null);
          setMessages([]);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "쪽지함 데이터를 불러오지 못했습니다.");
        setErrorStatus(err.status || null);
      } finally {
        if (active) setLoading(false);
      }
    };

    initMessages();

    return () => {
      active = false;
    };
  }, [authChecked, selectConversation, userId]);

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, async ({ conversation, chatMessage }) => {
      if (conversation) {
        setConversations((prev) => upsertConversation(prev, conversation));
      }

      if (
        chatMessage &&
        String(chatMessage.conversationId) === String(selectedIdRef.current)
      ) {
        const isIncoming = String(chatMessage.senderId) !== String(userId);
        const normalizedMsg = isIncoming
          ? { ...chatMessage, isRead: true }
          : chatMessage;

        setMessages((prev) => {
          if (prev.some((m) => m.id === normalizedMsg.id)) return prev;
          return [...prev, normalizedMsg];
        });

        if (conversation) {
          setActiveConversation(
            isIncoming ? { ...conversation, unreadCount: 0 } : conversation
          );
        }

        if (isIncoming) {
          try {
            const readRes = await markConversationAsRead(
              chatMessage.conversationId
            );
            if (readRes?.conversation) {
              setConversations((prev) =>
                upsertConversation(prev, readRes.conversation)
              );
              setActiveConversation(readRes.conversation);
            }
            emitNotificationsUpdated();
          } catch {
            // 다음 방 조회 시 서버에서 재동기화됨
          }
        }
      }
    });

    socket.on(
      SOCKET_EVENTS.MESSAGE_UPDATED,
      ({ conversationId, conversation, chatMessage }) => {
        if (conversation) {
          setConversations((prev) => upsertConversation(prev, conversation));
        }
        if (
          chatMessage &&
          String(conversationId) === String(selectedIdRef.current)
        ) {
          setMessages((prev) =>
            prev.map((m) => (m.id === chatMessage.id ? chatMessage : m))
          );
          if (conversation) {
            setActiveConversation(conversation);
          }
        }
      }
    );

    socket.on(
      SOCKET_EVENTS.MESSAGE_DELETED,
      ({ conversationId, messageId, chatMessage, conversation }) => {
        if (conversation) {
          setConversations((prev) => upsertConversation(prev, conversation));
        }
        if (String(conversationId) === String(selectedIdRef.current)) {
          if (chatMessage) {
            setMessages((prev) =>
              prev.map((m) => (m.id === String(messageId) ? chatMessage : m))
            );
          }
          if (conversation) {
            setActiveConversation(conversation);
          }
        }
      }
    );

    socket.on(
      SOCKET_EVENTS.MESSAGE_READ,
      ({ conversationId, readMessageIds = [], conversation }) => {
        if (conversation) {
          setConversations((prev) => upsertConversation(prev, conversation));
        }
        if (String(conversationId) === String(selectedIdRef.current)) {
          const readIdSet = new Set(readMessageIds.map(String));
          setMessages((prev) =>
            prev.map((m) =>
              readIdSet.size === 0 || readIdSet.has(String(m.id))
                ? { ...m, isRead: true }
                : m
            )
          );
          if (conversation) {
            setActiveConversation(conversation);
          }
        }
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const sendMessage = async (content) => {
    const targetConvId = selectedConversationId;
    if (!targetConvId) return false;
    setSending(true);
    setFeedbackBanner(null);
    setError("");

    try {
      const data = await createDirectMessage(targetConvId, content);
      if (data.chatMessage) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.chatMessage.id)) return prev;
          return [...prev, data.chatMessage];
        });
      }
      if (data.conversation) {
        setActiveConversation(data.conversation);
        setConversations((prev) => upsertConversation(prev, data.conversation));
      }
      setDraftsByConversation((prev) => {
        const next = { ...prev };
        delete next[String(targetConvId)];
        return next;
      });
      return true;
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        message: err.message || "쪽지 전송에 실패했습니다.",
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const editMessage = async (messageId, content) => {
    setProcessingMessageId(String(messageId));
    setFeedbackBanner(null);

    try {
      const data = await updateDirectMessage(messageId, content);
      if (data.chatMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.chatMessage.id ? data.chatMessage : m))
        );
      }
      if (data.conversation) {
        setActiveConversation(data.conversation);
        setConversations((prev) => upsertConversation(prev, data.conversation));
      }
      return true;
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        message: err.message || "쪽지 수정에 실패했습니다.",
      });
      return false;
    } finally {
      setProcessingMessageId("");
    }
  };

  const removeMessage = async (messageId) => {
    setProcessingMessageId(String(messageId));
    setFeedbackBanner(null);

    try {
      const data = await deleteDirectMessage(messageId);
      if (data.chatMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.chatMessage.id ? data.chatMessage : m))
        );
      }
      if (data.conversation) {
        setActiveConversation(data.conversation);
        setConversations((prev) => upsertConversation(prev, data.conversation));
      }
      return true;
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        message: err.message || "쪽지 삭제에 실패했습니다.",
      });
      return false;
    } finally {
      setProcessingMessageId("");
    }
  };

  const activeDraft =
    userId && selectedConversationId
      ? draftsByConversation[String(selectedConversationId)] || ""
      : "";

  return {
    currentUser,
    authChecked,
    conversations: userId ? conversations : [],
    selectedConversationId: userId ? selectedConversationId : "",
    activeConversation: userId ? activeConversation : null,
    messages: userId ? messages : [],
    activeDraft,
    loading,
    threadLoading,
    sending,
    processingMessageId,
    error,
    errorStatus,
    feedbackBanner,
    actions: {
      selectConversation,
      clearSelectedConversation,
      setDraft,
      sendMessage,
      editMessage,
      removeMessage,
      clearError: () => setError(""),
      clearFeedback: () => setFeedbackBanner(null),
    },
  };
}
