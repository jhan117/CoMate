import React, { useState, useEffect } from 'react';
import AuthBar from './components/AuthBar';
import PostForm from './components/PostForm';
import PostCard from './components/PostCard';
import styles from './App.module.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) return setCurrentUser(null);
      const data = await res.json();
      if (data.loggedIn) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) return;
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkAuth();
    loadPosts();
  }, []);

  const handleLogin = async (username, password) => {
    if (!username || !password) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        alert('로그인 성공!');
        checkAuth();
      } else {
        alert(data.message || data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      alert('백엔드 서버와 연결할 수 없습니다.');
    }
  };

  const handleSignup = async (userData, onSuccess) => {
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      alert(data.message || data.error || '회원가입 처리 완료');
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      alert('백엔드 서버와 연결할 수 없습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setCurrentUser(null);
      alert('로그아웃 되었습니다.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (newPostData) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostData)
      });
      const data = await res.json();
      if (res.ok) {
        loadPosts();
      } else {
        alert(data.message || data.error || '게시글 작성 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('서버 통신 오류가 발생했습니다.');
    }
  };

  const handleApprove = async (postId, deptName) => {
    try {
      const res = await fetch(`/api/posts/${postId}/join`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deptName })
      });
      const data = await res.json();
      if (res.ok) {
        loadPosts();
      } else {
        alert(data.message || data.error || '인원 승인 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('서버 통신 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        loadPosts();
      } else {
        alert(data.message || data.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('서버 통신 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <AuthBar
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSignup={handleSignup}
      />
      <PostForm onCreatePost={handleCreatePost} currentUser={currentUser} />
      <div className={styles.cardContainer}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            onApprove={handleApprove}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}