import React, { useState } from 'react';
import styles from './AuthBar.module.css';

export default function AuthBar({ currentUser, onLogin, onLogout, onSignup }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    onSignup({ username, password, name, dept }, () => {
      setIsSignup(false);
      setUsername('');
      setPassword('');
      setName('');
      setDept('');
    });
  };

  return (
    <div className={styles.authBar}>
      {currentUser ? (
        <div className={styles.userInfo}>
          <span>👤 <strong>{currentUser.name}</strong>님 ({currentUser.dept}) 환영합니다!</span>
          <button onClick={onLogout} className={styles.btn}>로그아웃</button>
        </div>
      ) : isSignup ? (
        <form onSubmit={handleSignupSubmit} className={styles.loginForm}>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="text"
            placeholder="학과"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.btn}>가입완료</button>
          <button type="button" onClick={() => setIsSignup(false)} className={styles.btnSecondary}>취소</button>
        </form>
      ) : (
        <form onSubmit={handleLoginSubmit} className={styles.loginForm}>
          <span>로그인이 필요합니다.</span>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button type="submit" className={styles.btn}>로그인</button>
          <button type="button" onClick={() => setIsSignup(true)} className={styles.btnSecondary}>회원가입</button>
        </form>
      )}
    </div>
  );
}