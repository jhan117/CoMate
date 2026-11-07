import React, { useState } from 'react';
import styles from './PostCard.module.css';

export default function PostCard({ post, currentUser, onApprove, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!post) return null;

  const isAuthor = currentUser && currentUser.name === post.author;
  const depts = Array.isArray(post.departments)
    ? post.departments
    : typeof post.departments === 'string'
    ? JSON.parse(post.departments)
    : [];

  return (
    <div className={styles.card}>
      <div className={styles.title}>{post.title || '제목 없음'}</div>
      <div className={styles.author}>작성자: {post.author || '익명'}</div>
      <div className={styles.deptList}>
        {depts.map((dept, index) => {
          const current = dept.currentMembers || 0;
          const max = dept.maxMembers || 0;
          const isFull = current >= max;
          return (
            <div key={index} className={styles.deptItem}>
              <span><strong>{dept.deptName}</strong> ({current}/{max})</span>
              {isAuthor && isEditing && (
                <button
                  onClick={() => onApprove(post.id, dept.deptName)}
                  disabled={isFull}
                  className={styles.btnApprove}
                >
                  {isFull ? '완료' : '+1 승인'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.deadline}>마감일: {post.deadline || '미정'}</div>
      {isAuthor && (
        <div className={styles.btnRow}>
          <button onClick={() => setIsEditing(!isEditing)} className={styles.btnEdit}>
            {isEditing ? '완료' : '수정 (+인원)'}
          </button>
          <button onClick={() => onDelete(post.id)} className={styles.btnDel}>
            삭제
          </button>
        </div>
      )}
    </div>
  );
}