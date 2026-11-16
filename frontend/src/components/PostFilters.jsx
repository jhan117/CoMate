
import styles from './PostFilters.module.css'

export default function PostFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  department,
  onDepartmentChange,
  categories,
  departments,
}) {
  return (
    <div className={styles.filters}>
      <label className={styles.field}>
        제목·내용 검색
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="모집글 검색"
        />
      </label>

      <label className={styles.field}>
        분류
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">전체</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        모집 학과
        <select
          value={department}
          onChange={(event) => onDepartmentChange(event.target.value)}
        >
          <option value="">전체</option>
          {departments.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
