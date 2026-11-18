import styles from "./MessageIconLink.module.css";

function MessageIconLink({
  recipientId,
  postId = "",
  label = "쪽지 보내기",
  className = "",
}) {
  if (!recipientId) return null;

  const params = new URLSearchParams({
    to: String(recipientId),
    ...(postId ? { postId: String(postId) } : {}),
  });

  return (
    <a
      href={`/messages?${params.toString()}`}
      className={`${styles.iconLink} ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </a>
  );
}

export default MessageIconLink;
