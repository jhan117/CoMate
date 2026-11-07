export const APPLICATION_STATUS = {
  PENDING: "pending",
  REVISION_REQUESTED: "revision_requested",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const STATUS_LABELS = {
  [APPLICATION_STATUS.PENDING]: "대기중",
  [APPLICATION_STATUS.REVISION_REQUESTED]: "보완 요청",
  [APPLICATION_STATUS.APPROVED]: "승인됨",
  [APPLICATION_STATUS.REJECTED]: "거절됨",
};

export const STATUS_FILTER_TABS = [
  { key: "all", label: "전체" },
  {
    key: APPLICATION_STATUS.PENDING,
    label: STATUS_LABELS[APPLICATION_STATUS.PENDING],
  },
  {
    key: APPLICATION_STATUS.REVISION_REQUESTED,
    label: STATUS_LABELS[APPLICATION_STATUS.REVISION_REQUESTED],
  },
  {
    key: APPLICATION_STATUS.APPROVED,
    label: STATUS_LABELS[APPLICATION_STATUS.APPROVED],
  },
  {
    key: APPLICATION_STATUS.REJECTED,
    label: STATUS_LABELS[APPLICATION_STATUS.REJECTED],
  },
];

export const STATUS_NOTICE_MESSAGES = {
  [APPLICATION_STATUS.APPROVED]: "지원이 승인되어 팀원으로 확정되었습니다.",
  [APPLICATION_STATUS.REJECTED]:
    "지원이 거절되었습니다. 거절된 모집글에는 다시 지원할 수 없습니다.",
  [APPLICATION_STATUS.PENDING]:
    "작성자가 지원서를 검토 중입니다. 승인 전에는 지원을 취소할 수 있습니다.",
};
