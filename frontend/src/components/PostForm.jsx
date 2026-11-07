import React, { useState } from 'react';
import styles from './PostForm.module.css';

export default function PostForm({ onCreatePost, currentUser }) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [departments, setDepartments] = useState([{ deptName: '', maxMembers: '' }]);

  const handleDeptChange = (index, field, value) => {
    const updated = [...departments];
    updated[index][field] = value;
    setDepartments(updated);
  };

  const addDeptField = () => {
    setDepartments([...departments, { deptName: '', maxMembers: '' }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    const validDepts = departments.filter(d => d.deptName && d.maxMembers);
    if (!title || !deadline || validDepts.length === 0) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    onCreatePost({ title, deadline, departments: validDepts });
    setTitle('');
    setDeadline('');
    setDepartments([{ deptName: '', maxMembers: '' }]);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h3>📢 새 모집글 작성하기</h3>
      <input
        type="text"
        placeholder="1. 대회/공모전 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.input}
      />
      <div className={styles.deptSection}>
        <label>3. 모집 학과 및 인원 지정</label>
        {departments.map((dept, index) => (
          <div key={index} className={styles.deptRow}>
            <input
              type="text"
              placeholder="학과명 (예: 컴퓨터공학과)"
              value={dept.deptName}
              onChange={(e) => handleDeptChange(index, 'deptName', e.target.value)}
              className={styles.inputDeptName}
            />
            <input
              type="number"
              placeholder="인원수"
              value={dept.maxMembers}
              onChange={(e) => handleDeptChange(index, 'maxMembers', e.target.value)}
              className={styles.inputDeptMax}
            />
          </div>
        ))}
        <button type="button" onClick={addDeptField} className={styles.btnAddDept}>
          + 학과 추가하기
        </button>
      </div>
      <label>4. 마감 날짜</label>
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className={styles.input}
      />
      <button type="submit" className={styles.btnSubmit}>작성 완료</button>
    </form>
  );
}