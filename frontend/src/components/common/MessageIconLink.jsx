import MessageIcon from "./MessageIcon";
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
      <MessageIcon className={styles.icon} />
    </a>
  );
}

export default MessageIconLink;
