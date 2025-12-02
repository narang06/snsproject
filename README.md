# Questly - 데일리 소셜 챌린지 SNS

## 프로젝트 소개
[ "사용자들이 매일 새로운 챌린지에 참여하고, 자신의 경험을 공유하며, 다른 사용자들과 소통할 수 있는 소셜 네트워킹 서비스입니다."]

## 주요 기능
*   사용자 인증 (회원가입, 로그인)
*   프로필 관리 (자기소개, 프로필 이미지 변경)
*   일일 퀘스트 조회 및 참여
*   퀘스트 제출 및 다른 사용자 게시물 조회
*   게시물 좋아요 및 댓글 작성
*   사용자 팔로우/언팔로우
*   실시간 알림 (팔로우, 좋아요, 댓글 등)

## 기술 스택
### 클라이언트 (Frontend)
*   **React**: UI 개발을 위한 JavaScript 라이브러리
*   **Material UI (MUI)**: 현대적인 UI 컴포넌트 라이브러리
*   **React Router DOM**: 클라이언트 사이드 라우팅
*   **Emotion**: CSS-in-JS 라이브러리
*   **JWT Decode**: JWT 토큰 디코딩

### 서버 (Backend)
*   **Node.js & Express.js**: 백엔드 API 서버
*   **MySQL2**: MySQL 데이터베이스 클라이언트
*   **bcrypt / jsonwebtoken**: 사용자 인증 및 보안
*   **multer**: 파일 업로드 처리
*   **cors**: 교차 출처 리소스 공유
*   **dotenv**: 환경 변수 관리
*   **node-cron**: 스케줄링 작업

## 설치 및 실행 방법

### 사전 준비
*   Node.js (LTS 버전 권장)
*   MySQL 데이터베이스 서버

### 1. 데이터베이스 설정
1.  MySQL 서버를 실행합니다.
2.  데이터베이스를 생성합니다. (예: `CREATE DATABASE questly_db;`)
3.  `snsproject/server/db.js` 파일을 확인하여 데이터베이스 연결 정보가 올바른지 확인합니다.
    *   `host`, `user`, `password`, `database` 정보가 필요합니다.
4.  필요한 테이블 스키마를 생성합니다. (스키마 파일이 있다면 해당 스크립트를 실행합니다.)

### 2. 서버 설정 및 실행
1.  `snsproject/server` 디렉토리로 이동합니다.
    ```bash
    cd snsproject/server
    ```
2.  의존성 패키지를 설치합니다.
    ```bash
    npm install
    ```
3.  `.env` 파일을 생성하고 다음 환경 변수를 설정합니다. (예시)
    ```
    PORT=3010
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_NAME=questly_db
    JWT_SECRET=your-secret-key-for-jwt-token
    ```
4.  서버를 실행합니다.
    ```bash
    npm start
    # 또는 개발 모드: npm run dev
    ```

### 3. 클라이언트 설정 및 실행
1.  `snsproject/client` 디렉토리로 이동합니다.
    ```bash
    cd snsproject/client
    ```
2.  의존성 패키지를 설치합니다.
    ```bash
    npm install
    ```
3.  클라이언트 애플리케이션을 실행합니다.
    ```bash
    npm start
    ```
4.  웹 브라우저에서 `http://localhost:3000` (기본값)으로 접속합니다.

## 개발자 정보
[여기에 개발자 정보를 작성해주세요. 예: "홍길동 (gildong.hong@example.com)"]
