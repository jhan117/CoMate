export const NOTIFICATION_TYPES = {
  APPLICATION_NEW: "application_new",
  APPLICATION_RESUBMITTED: "application_resubmitted",
  APPLICATION_APPROVED: "application_approved",
  APPLICATION_REVISION: "application_revision",
  APPLICATION_REJECTED: "application_rejected",
  RECRUITMENT_CLOSED: "recruitment_closed",
};

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.APPLICATION_NEW]: "신규 지원",
  [NOTIFICATION_TYPES.APPLICATION_RESUBMITTED]: "보완 재제출",
  [NOTIFICATION_TYPES.APPLICATION_APPROVED]: "지원 승인",
  [NOTIFICATION_TYPES.APPLICATION_REVISION]: "보완 요청",
  [NOTIFICATION_TYPES.APPLICATION_REJECTED]: "지원 거절",
  [NOTIFICATION_TYPES.RECRUITMENT_CLOSED]: "모집 마감",
};

export const NOTIFICATION_EVENTS = {
  ACTIVE_USER_CHANGED: "comate:active-user-changed",
  NOTIFICATIONS_UPDATED: "comate:notifications-updated",
};

export function emitActiveUserChanged(user) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENTS.ACTIVE_USER_CHANGED, { detail: user })
  );
}

export function emitNotificationsUpdated() {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENTS.NOTIFICATIONS_UPDATED)
  );
}
