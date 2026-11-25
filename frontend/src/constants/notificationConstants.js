export const NOTIFICATION_TYPES = {
  APPLICATION_NEW: "application_new",
  APPLICATION_RESUBMITTED: "application_resubmitted",
  APPLICATION_APPROVED: "application_approved",
  APPLICATION_REVISION: "application_revision",
  APPLICATION_REJECTED: "application_rejected",
  RECRUITMENT_CLOSED: "recruitment_closed",
  MESSAGE_NEW: "message_new",
};

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.APPLICATION_NEW]: "신규 지원",
  [NOTIFICATION_TYPES.APPLICATION_RESUBMITTED]: "보완 재제출",
  [NOTIFICATION_TYPES.APPLICATION_APPROVED]: "지원 승인",
  [NOTIFICATION_TYPES.APPLICATION_REVISION]: "보완 요청",
  [NOTIFICATION_TYPES.APPLICATION_REJECTED]: "지원 거절",
  [NOTIFICATION_TYPES.RECRUITMENT_CLOSED]: "모집 마감",
  [NOTIFICATION_TYPES.MESSAGE_NEW]: "새 쪽지",
};

export const NOTIFICATION_EVENTS = {
  ACTIVE_USER_CHANGED: "comate:active-user-changed",
  NOTIFICATIONS_UPDATED: "comate:notifications-updated",
  APPLICATION_PAGE_REFRESH: "comate:application-page-refresh",
};

const AUTH_SYNC_CHANNEL_NAME = "comate-auth-sync";
const authSyncChannel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new window.BroadcastChannel(AUTH_SYNC_CHANNEL_NAME)
    : null;

if (authSyncChannel) {
  authSyncChannel.onmessage = (event) => {
    if (event.data?.type === "ACTIVE_USER_CHANGED") {
      emitActiveUserChanged(event.data.user ?? null, { broadcast: false });
    }
  };
}

export function emitActiveUserChanged(user, { broadcast = true } = {}) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED, { detail: user })
  );

  if (broadcast && authSyncChannel) {
    authSyncChannel.postMessage({
      type: "ACTIVE_USER_CHANGED",
      user: user ?? null,
    });
  }
}

export function emitNotificationsUpdated() {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENTS.NOTIFICATIONS_UPDATED)
  );
}

export function emitApplicationPageRefresh(detail = null) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENTS.APPLICATION_PAGE_REFRESH, { detail })
  );
}
