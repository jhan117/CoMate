# CoMate

교내 수업, 공모전, 해커톤 팀원 모집부터 지원, 승인, 실시간 알림 및 1:1 쪽지까지 처리하는 풀스택 매칭 플랫폼입니다.

> **Live Demo**: [https://comate-8szz.onrender.com](https://comate-8szz.onrender.com/) (React + Express API + 실시간 Socket.IO 단일 배포)

## Team & Contribution Statement

| 팀원 | GitHub | 담당 영역 및 구현 기능 |
| :--- | :--- | :--- |
| **권기영 (Kaye)** | `@jhan117` | **초기 세팅, DB 및 실행 통합**: 프로젝트 초기 세팅, 루트 `npm install`/`start` 정적 서빙, Vercel/Render 배포 설정, Docker Compose 및 GitHub Codespaces(`.devcontainer`) 환경 구성, PostgreSQL(Supabase) 스키마 및 가상 시드 데이터(`backend/db/*`)<br>**지원/승인, 알림 및 실시간 1:1 쪽지**: 지원서 제출/보완/승인/거절/취소, 알림 센터 및 내 모집/지원 허브, `Socket.IO` 실시간 알림 및 1:1 쪽지(`conversations`, `messages`)<br>**인증/보안 통합 및 공용 UI 정리**: `requireAuth`(`publicUser` 정제) 및 소유권 검증, 이메일 인증 통합 마이그레이션(지원/쪽지 모델·컴포넌트·테스트), 보안 테스트 4종(`tests/01` ~ `04`), 공용 `httpClient`/`Modal`/`MessageIcon` 추출, `PostForm` 모달, 카드 동선/마감 뱃지 및 세션 동기화 |
| **김희서 (Ella)** | `@HeeSeoKim-73` | **회원 인증 및 보안**: 이메일 기반 회원가입/로그인/로그아웃 API(`authController`, `userModel`, `routes/auth`), `bcrypt`(cost 10) 비밀번호 해싱 및 평문 인증 제거, `express-session` 적용 및 세션 비밀키 32자 이상 검증, 헤더 로그인/회원가입 모달(`AuthBar`)<br>**모집글 CRUD 및 보안 테스트**: PostgreSQL 기반 모집글 CRUD API 및 트랜잭션(`postController`, `postModel`, `routes/posts`), 게시판 검색/분류/학과 필터(`Body`, `PostFilters`, `PostForm`, `PostCard`), 도메인별 컴포넌트/CSS 모듈 분리, 회원가입·모집글 보안 테스트(`tests/05`) |

## Tech Stack

- **Frontend**: React 19, Vite 8, CSS Modules, `socket.io-client` 4.8
- **Backend**: Node.js (20+ 권장), Express 5, `express-session`, `bcrypt` 6, `socket.io` 4.8, `cors`, `dotenv`
- **Database**: PostgreSQL 16 (운영: Supabase / 로컬·Codespaces: Docker Compose, `pg` 8)
- **Optional Extensions**: `Socket.IO` 실시간 알림 및 1:1 쪽지, PostgreSQL 관계형 DB 및 트랜잭션, React + 반응형 CSS Modules, ESLint 10 및 자동화 보안 테스트 5종(`tests/01` ~ `05`), Vercel/Render 라이브 배포 및 Docker/Codespaces 개발 환경

## Features

- **회원 인증**: 이메일 기반 회원가입·로그인·로그아웃, `bcrypt`(cost 10) 비밀번호 해싱 및 `express-session` 쿠키 인증(`httpOnly`, `sameSite`)
- **팀원 모집 게시판**: 모집글 CRUD, 분류/학과 필터링, 검색, 학과별 정원 현황, 마감 상태(`마감`, `D-day`, `D-3` 임박) 뱃지 및 역할별 동선 분리
- **지원 및 승인 관리**: 학과별 지원서 제출, 보완 요청 및 재제출, 승인/거절/지원 취소, 목표 인원 달성 시 자동 마감, 내 활동 허브(`내 모집/지원`)
- **실시간 알림 센터 및 쪽지 뱃지 분리**: 상단 쪽지 안 읽은 대화 뱃지와 모집/지원 알림 벨(`전체`, `안 읽음`)을 분리하고 단건/일괄 읽음 및 삭제, `Socket.IO` 실시간 갱신 지원
- **실시간 1:1 쪽지**: 대화방 개설, `Socket.IO` 기반 실시간 송수신, 수정, soft delete, 읽음 처리 및 알림 연동

## Getting Started

Node.js 20 이상과 PostgreSQL(`DATABASE_URL`) 환경이 필요합니다. **GitHub Codespaces**, **로컬 Docker**, **외부 PostgreSQL(Supabase 등)** 3가지 방식을 모두 지원합니다.

### 0. PostgreSQL 준비 (택 1)

- **방법 A — GitHub Codespaces (가장 간편)**: 레포에서 **Code → Codespaces → Create codespace**를 열면 `.devcontainer` 설정에 의해 Node.js 22와 로컬 PostgreSQL 16(`localhost:5432/comate`)이 자동으로 함께 실행됩니다. *(추가 DB 설치 불필요)*
- **방법 B — 로컬 PC + Docker**: 프로젝트 루트에서 아래 명령어로 로컬 PostgreSQL 16 컨테이너를 실행합니다.
  ```bash
  docker compose up -d
  ```
- **방법 C — 외부 PostgreSQL / Supabase 사용**: 별도 Docker 실행 없이 아래 2단계에서 `backend/.env`의 `DATABASE_URL`에 본인 PostgreSQL 연결 URI를 입력합니다.

### 1. 설치, 환경 변수 설정, 시드 및 실행

1. **의존성 설치 및 프론트엔드 초기 빌드** (`postinstall` 스크립트가 `backend`, `frontend` 설치와 빌드를 함께 수행)
   ```bash
   npm install
   ```
2. **환경 변수 설정**: `backend/.env.example`을 복사해 `backend/.env` 생성
   ```bash
   cp backend/.env.example backend/.env
   ```
   - `PORT` (기본 `3000`)
   - `COMATE_SESSION_SECRET` (**32자 이상 필수**, 운영 시 임의의 랜덤 문자열로 교체)
   - `CLIENT_URL` (기본 `http://localhost:5173`)
   - `DATABASE_URL` (Codespaces / 로컬 Docker 기본값: `postgresql://postgres:postgres@localhost:5432/comate`, 외부 DB 사용 시 해당 URI로 교체)
3. **시드 데이터 적재** (가상 테스트 계정, 비밀번호는 모두 `test1234`: `user1@comate.test` 이서연, `user2@comate.test` 박준혁, `user5@comate.test` 한지민, `user6@comate.test` 오민재 등)
   ```bash
   npm run db:seed
   ```
4. **실행**
   ```bash
   npm start
   ```
   - 실행 후 `http://localhost:3000`에서 접속합니다. (프론트 수정 반영 시 `npm run build`, 개발 모드 분리 실행 시 `npm run dev:backend` 및 `npm run dev:frontend` -> Vite `http://localhost:5173` 프록시)

## API Endpoints

모든 인증 경로는 `comate.sid` 세션 쿠키를 검증합니다(미인증 `401`, 권한 없음 `403`).

<details>
<summary>전체 API 명세 보기 (REST 29개, Socket.IO 5개)</summary>

#### Auth & Health

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | 서버 상태 확인 |
| `POST` | `/api/auth/signup` | No | 회원가입 및 세션 생성 |
| `POST` | `/api/auth/login` | No | 로그인 및 세션 재생성 |
| `GET` | `/api/auth/me` | Yes | 현재 로그인 사용자 조회 |
| `POST` | `/api/auth/logout` | No | 세션 파기 및 쿠키 삭제 |

#### Posts

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | No | 모집글 목록 조회 |
| `GET` | `/api/posts/:id` | No | 모집글 단건 조회 |
| `POST` | `/api/posts` | Yes | 새 모집글 작성 |
| `PUT` | `/api/posts/:id` | Yes (Author) | 본인 모집글 수정 |
| `DELETE` | `/api/posts/:id` | Yes (Author) | 본인 모집글 삭제 (지원서 존재 시 `409`) |

#### Applications

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/applications?postId=` | Yes | 모집글 상세 및 지원 현황 조회 |
| `GET` | `/api/applications/overview` | Yes | 내 모집/지원 현황 요약 조회 |
| `GET` | `/api/applications/:id` | Yes (Owner/Author) | 지원서 단건 조회 |
| `POST` | `/api/applications` | Yes | 지원서 제출 |
| `PUT` | `/api/applications/:id` | Yes (Applicant) | 보완 요청 지원서 수정 재제출 |
| `PATCH` | `/api/applications/:id/status` | Yes (Post Author) | 지원서 승인, 보완 요청, 거절 처리 |
| `DELETE` | `/api/applications/:id` | Yes (Applicant) | 지원 취소 |

#### Notifications

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Yes | 알림 목록 및 안 읽은 개수 조회 |
| `PATCH` | `/api/notifications/read-all?filter=` | Yes | 필터(`all`, `unread`, `recruitment`, `recruitment_unread`, `message`) 일괄 읽음 |
| `DELETE` | `/api/notifications?filter=` | Yes | 필터 기준 일괄 삭제 |
| `PATCH` | `/api/notifications/:id/read` | Yes (Recipient) | 단건 알림 읽음 처리 |
| `DELETE` | `/api/notifications/:id` | Yes (Recipient) | 단건 알림 삭제 |

#### Messages

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/messages/conversations` | Yes | 내 1:1 대화방 목록 조회 |
| `POST` | `/api/messages/conversations` | Yes | 1:1 대화방 생성 또는 기존 대화방 열기 |
| `GET` | `/api/messages/conversations/:conversationId` | Yes (Participant) | 대화 메시지 조회 및 읽음 처리 |
| `PATCH` | `/api/messages/conversations/:conversationId/read` | Yes (Participant) | 대화방 읽음 처리 |
| `POST` | `/api/messages/conversations/:conversationId/messages` | Yes (Participant) | 새 쪽지 전송 |
| `PATCH` | `/api/messages/:id` | Yes (Sender) | 본인 쪽지 수정 |
| `DELETE` | `/api/messages/:id` | Yes (Sender) | 본인 쪽지 삭제 (soft delete) |

#### Socket.IO Events

핸드셰이크 시 `sessionMiddleware`로 세션을 검증(미인증 시 `UNAUTHORIZED`)한 뒤 개인 룸(`user:<id>`)과 세션 룸(`session:<sid>`)에 참가시켜 실시간 이벤트 발행 및 로그아웃 시 소켓 종료를 처리합니다.

| Event | Target | Trigger |
| :--- | :--- | :--- |
| `message:new` | 참여자(`user1`, `user2`) | 새 쪽지 전송 |
| `message:updated` | 참여자(`user1`, `user2`) | 쪽지 수정 |
| `message:deleted` | 참여자(`user1`, `user2`) | 쪽지 soft delete |
| `message:read` | 상대방 | 대화방 조회 또는 읽음 처리 |
| `notification:updated` | 수신자 / 읽음 처리자 | 지원/승인/보완/거절/마감 알림 또는 새 쪽지 알림 생성, 대화 읽음 반영 |

</details>

## Database Schema

서버 시작 시 [backend/db/schema.sql](backend/db/schema.sql)을 기준으로 자동 생성됩니다.

```mermaid
erDiagram
  users {
    int id PK
    varchar email UK
    varchar name
    varchar dept
    text password_hash
    timestamptz created_at
  }

  posts {
    int id PK
    int author_id FK
    varchar category
    varchar title
    text content
    date deadline
    timestamptz created_at
  }

  post_departments {
    int id PK
    int post_id FK
    varchar dept_name
    int current_members
    int max_members
  }

  applications {
    int id PK
    int post_id FK
    int applicant_id FK
    varchar target_dept FK
    text message
    varchar status
    text feedback
    timestamptz created_at
    timestamptz updated_at
    timestamptz processed_at
  }

  notifications {
    int id PK
    int recipient_id FK
    int post_id FK
    int application_id FK
    int conversation_id FK
    varchar type
    varchar title
    text message
    boolean is_read
    timestamptz created_at
  }

  conversations {
    int id PK
    int user1_id FK
    int user2_id FK
    int post_id FK
    timestamptz created_at
    timestamptz updated_at
  }

  messages {
    int id PK
    int conversation_id FK
    int sender_id FK
    text content
    boolean is_read
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  users ||--o{ posts : "author_id"
  posts ||--o{ post_departments : "post_id"
  posts ||--o{ applications : "post_id"
  users ||--o{ applications : "applicant_id"
  post_departments ||--o{ applications : "target_dept"
  users ||--o{ notifications : "recipient_id"
  posts ||--o{ notifications : "post_id"
  applications ||--o{ notifications : "application_id"
  conversations ||--o{ notifications : "conversation_id"
  users ||--o{ conversations : "user1_id"
  users ||--o{ conversations : "user2_id"
  posts ||--o{ conversations : "post_id"
  conversations ||--o{ messages : "conversation_id"
  users ||--o{ messages : "sender_id"
```

### 설계 의도
- **모집 부문 분리 및 복합 외래 키 (`posts` -> `post_departments` -> `applications`)**: 한 모집글 안에 여러 학과(또는 `학과 무관`) 정원을 독립적으로 관리하고, `applications(post_id, target_dept)`가 `post_departments(post_id, dept_name)`을 참조(`ON UPDATE CASCADE`, `ON DELETE RESTRICT`)하도록 묶어 개설되지 않은 학과 지원이나 지원 내역이 있는 부문 삭제를 DB 제약으로 차단했습니다.
- **중복 지원 차단 및 원글 삭제 보호 (`applications`)**: `UNIQUE (post_id, applicant_id)`로 동일 모집글 중복 지원을 막고, `post_id` 외래 키에 `ON DELETE RESTRICT`를 두어 지원서가 남아 있는 모집글이 임의로 삭제되지 않도록 했습니다.
- **1:1 대화방 정규화 (`conversations`)**: `CHECK (user1_id <> user2_id)`와 `CHECK (user1_id < user2_id)`, `UNIQUE (user1_id, user2_id)`를 함께 적용해 두 사용자 중 누가 먼저 대화를 시작하더라도 항상 작은 `user_id`를 `user1_id`로 정렬 저장해 중복 대화방 생성을 원천 차단했습니다.
- **메시지 soft delete 및 조회 인덱스 (`messages`)**: 삭제 시 대화 맥락과 상대방 실시간 동기화(`deleted_at`)를 유지하기 위해 soft delete로 설계했고, 대화방 목록(`updated_at DESC`)과 스레드 순서 조회(`conversation_id, id ASC`)용 인덱스를 추가했습니다.
- **통합 알림 구조 (`notifications`)**: 모집/지원 상태 알림과 1:1 쪽지 알림을 단일 테이블에서 관리하되 nullable 외래 키(`post_id`, `application_id`, `conversation_id`)를 두어 탭 필터링과 원글/대화방 바로 이동을 동시에 지원합니다.

## Security Tests

`backend/.env`에 `COMATE_SESSION_SECRET`과 `DATABASE_URL`을 설정한 뒤 실행합니다. (`localhost:3000` 미실행 시 `tests/_helper.js`가 포트 `3451`로 테스트 서버를 자동 실행, `TEST_BASE_URL` 지정 가능)

```bash
npm test
```

- `tests/01-invalid-login.test.js`: 미등록 이메일 및 잘못된 비밀번호 `401` + 동일 에러 메시지 검증
- `tests/02-user-isolation.test.js`: 미인증 차단(`401`), 타 사용자 지원서/알림 격리(`403`), `int4` 범위 초과 차단(`404`), 마감일 경과 모집글 지원 차단(`409`) 검증
- `tests/03-logout-session.test.js`: 로그아웃 이후 기존 세션 쿠키 무효화(`401` 차단) 및 `/api/auth/me` 응답 정제 검증
- `tests/04-messages-security.test.js`: 쪽지 CRUD, 읽음/알림 연동, 권한 격리(`401`/`403`/`404`/`409`), Socket.IO 인증, 룸 격리 및 로그아웃 시 활성 소켓 강제 종료 검증
- `tests/05-auth-posts-security.test.js`: 회원가입 유효성/이메일 중복(`400`/`409`), `bcrypt` 해싱, 로그인, 모집글 CRUD·소유권 격리(`401`/`403`/`404`)·지원서 보호(`409`) 검증

## Project Structure

```text
CoMate/
├── .devcontainer/      # GitHub Codespaces (Node.js 22 + PostgreSQL 16) 자동 구성
├── backend/            # controllers, db(schema/seed), middlewares, models, routes, socket, server.js
├── frontend/           # api, components, constants, hooks, pages, utils
├── tests/              # 보안 및 권한 격리 테스트 5종
├── docs/               # 회의록 및 초기 스케치
└── docker-compose.yml  # 로컬 PostgreSQL 16 실행 설정
```

## Known Limitations

- **인메모리 세션 스토어**: 현재 `express-session` 기본 `MemoryStore`를 사용하므로 백엔드 서버 재시작 시 기존 로그인 세션이 초기화됩니다. 실서비스 확장 시 PostgreSQL(`connect-pg-simple`) 또는 Redis 기반 영구 세션 스토어 전환이 필요합니다.
- **이메일 인증 및 비밀번호 재설정 미구현**: 과제 범위상 가상 테스트 이메일로 즉시 가입·로그인할 수 있으며, 실제 메일 발송 기반 본인 인증과 비밀번호 찾기는 추후 확장 과제입니다.
- **추가 보안 하드닝 예정**: 로그인 요청 횟수 제한(`express-rate-limit`), CSRF 토큰, `helmet` 보안 헤더는 실제 사용자 오픈 전 추가 보강이 필요합니다.
- **PostgreSQL 실행 환경 필요**: 로컬/Codespaces 실행 시 `docker compose up -d`(또는 Codespaces `.devcontainer` 자동 실행)나 외부 PostgreSQL(`DATABASE_URL`) 연결이 필요합니다.

## AI Tools & References

- **ChatGPT**: 기능 기획 검토, 에러 원인 분석 및 문서 초안 정리
- **Gemini / Antigravity**: 코드 리뷰, 최소 기술 요구사항(R1–R12) 및 보안 테스트 점검, PostgreSQL 마이그레이션 및 리팩토링 검토
- **검증 원칙**: AI 도구의 제안은 참고·검토 용도로만 활용했으며, 모든 코드는 팀원이 직접 이해하고 자동화 보안 테스트(`npm test`) 및 실행 검증을 거쳐 반영했습니다.
