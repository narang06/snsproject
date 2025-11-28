import express from "express";
import fs from "fs"; // fs 모듈 임포트
const router = express.Router();
import db from "../db.js";
import authMiddleware from "../auth.js";
import multer from "multer";
import path from "path";

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date().toISOString().split("T")[0];
    const uploadDir = `uploads/submissions/${today}`;
    // uploads/submissions/YYYY-MM-DD 디렉토리가 없으면 생성
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 동시 업로드 시 파일 이름 충돌을 방지하기 위해 난수를 추가합니다.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 피드 조회
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const { date, query, sort } = req.query;

    let whereClause = "WHERE 1=1";
    const queryParams = [];

    // 날짜 필터링
    if (date) {
      whereClause += " AND DATE(s.created_at) = ?";
      queryParams.push(date); 
    }

    // 닉네임 검색
    if (query) {
      whereClause += " AND u.nickname LIKE ?";
      queryParams.push(`%${query}%`);
    }

    let orderByClause = "ORDER BY s.created_at DESC"; // 기본 정렬

    // 정렬 조건
    switch (sort) {
      case "likes":
        orderByClause = "ORDER BY likeCount DESC, s.created_at DESC"; // 좋아요 수가 같으면 최신순
        break;
      case "comments":
        orderByClause = "ORDER BY commentCount DESC, s.created_at DESC"; // 댓글 수가 같으면 최신순
        break;
      case "latest":
      default:
        orderByClause = "ORDER BY s.created_at DESC";
        break;
    }

    const sqlQuery = `
      SELECT
        s.id, s.daily_quest_id, s.user_id, s.content_text as content, s.content_image_url as image_url, s.created_at,
        u.nickname, u.nickname_tag, u.profile_image_url as userProfileImage,
        q.title as questTitle,
        COUNT(DISTINCT l.user_id) as likeCount,
        COUNT(DISTINCT c.id) as commentCount
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN daily_quests dq ON s.daily_quest_id = dq.id
      JOIN quests q ON dq.quest_id = q.id
      LEFT JOIN likes l ON s.id = l.submission_id
      LEFT JOIN comments c ON s.id = c.submission_id
      ${whereClause}
      GROUP BY s.id
      ${orderByClause}
    `;

    const [submissions] = await db.query(sqlQuery, queryParams);

    res.status(200).json(submissions);
  } catch (err) {
    console.error("피드 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 특정 데일리 퀘스트의 제출물 조회
router.get("/quest/:dailyQuestId", authMiddleware, async (req, res) => {
  try {
    const { dailyQuestId } = req.params;

    const [submissions] = await db.query(
      `SELECT 
        s.id, s.daily_quest_id, s.user_id, s.content_text as content, s.content_image_url as image_url, s.created_at,
        u.nickname, u.nickname_tag, u.profile_image_url as userProfileImage,
        q.title as questTitle,
        COUNT(DISTINCT l.user_id) as likeCount,
        COUNT(DISTINCT c.id) as commentCount
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       JOIN daily_quests dq ON s.daily_quest_id = dq.id
       JOIN quests q ON dq.quest_id = q.id
       LEFT JOIN likes l ON s.id = l.submission_id
       LEFT JOIN comments c ON s.id = c.submission_id
       WHERE s.daily_quest_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [dailyQuestId]
    );

    res.status(200).json(submissions);
  } catch (err) {
    console.error("제출물 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 단일 제출물 조회
router.get("/:submissionId", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const sqlQuery = `
      SELECT
        s.id, s.daily_quest_id, s.user_id, s.content_text as content, s.content_image_url as image_url, s.created_at,
        u.nickname, u.nickname_tag, u.profile_image_url as userProfileImage,
        q.title as questTitle,
        COUNT(DISTINCT l.user_id) as likeCount,
        COUNT(DISTINCT c.id) as commentCount
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN daily_quests dq ON s.daily_quest_id = dq.id
      JOIN quests q ON dq.quest_id = q.id
      LEFT JOIN likes l ON s.id = l.submission_id
      LEFT JOIN comments c ON s.id = c.submission_id
      WHERE s.id = ?
      GROUP BY s.id
    `;

    const [submissions] = await db.query(sqlQuery, [submissionId]);

    if (submissions.length === 0) {
      return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }

    res.status(200).json({ submission: submissions[0] });
  } catch (err) {
    console.error("단일 제출물 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


// 제출물 생성
router.post("/", authMiddleware, upload.array("images", 5), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { dailyQuestId, content } = req.body;
    
    if (!req.files || req.files.length === 0) { 
      return res.status(400).json({ message: "퀘스트 인증을 위해 이미지는 필수입니다." });
    }

    const today = new Date().toISOString().split("T")[0];
    const imageUrls = req.files.map(file => `/uploads/submissions/${today}/${file.filename}`);
    const imageUrlsJson = JSON.stringify(imageUrls);

    if (!dailyQuestId || !content) {
      return res.status(400).json({ message: "필수 필드를 모두 입력해주세요." });
    }

    if (content.trim().length < 10 || content.trim().length > 500) {
      return res.status(400).json({ message: "내용은 10자 이상 500자 이하로 입력해주세요." });
    }

    if (!dailyQuestId || !content) {
      return res.status(400).json({ message: "필수 필드를 입력해주세요" });
    }

    await db.query(
      "INSERT INTO submissions (daily_quest_id, user_id, content_text, content_image_url) VALUES (?, ?, ?, ?)",
      [dailyQuestId, userId, content, imageUrlsJson]
    );

    res.status(201).json({ message: "제출 성공" });
  } catch (err) {
    console.error("제출 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 제출물 삭제
router.delete("/:submissionId", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.userId;

    // 1. 삭제 전, 권한 확인 및 이미지 경로 확보
    const [submissions] = await db.query(
      "SELECT user_id, content_image_url FROM submissions WHERE id = ?",
      [submissionId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }
    
    const submission = submissions[0];

    if (submission.user_id !== userId) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    // 2. 데이터베이스에서 게시물 기록 삭제
    await db.query("DELETE FROM submissions WHERE id = ?", [submissionId]);

    // 3. DB 삭제 성공 후, 서버에서 실제 이미지 파일들 삭제
    if (submission.content_image_url) {
      try {
        const images = JSON.parse(submission.content_image_url);
        if (Array.isArray(images)) {
          images.forEach(imageUrl => {
            const filePath = path.join(new URL('.', import.meta.url).pathname, '..', imageUrl).substring(1);
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`이미지 파일 삭제 실패: ${filePath}`, err);
              }
            });
          });
        }
      } catch (e) {
        console.error("이미지 경로 파싱 또는 삭제 중 오류 발생:", e);
      }
    }

    res.status(200).json({ message: "삭제 성공" });
  } catch (err) {
    console.error("삭제 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 제출물 수정 (내용 및 이미지)
router.put("/:submissionId", authMiddleware, upload.array("images", 5), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { content, imagesToDelete } = req.body;
    const userId = req.user.userId;

    // 1. 권한 확인 및 기존 데이터 조회
    const [submissions] = await db.query(
      "SELECT user_id, content_image_url FROM submissions WHERE id = ?",
      [submissionId]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }
    if (submissions[0].user_id !== userId) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    // 2. 삭제할 이미지 처리
    const imagesToDeleteParsed = imagesToDelete ? JSON.parse(imagesToDelete) : [];
    if (imagesToDeleteParsed.length > 0) {
      imagesToDeleteParsed.forEach(imageUrl => {
        const filePath = path.join(new URL('.', import.meta.url).pathname, '..', imageUrl).substring(1);
        fs.unlink(filePath, (err) => {
          if (err) console.error(`삭제 실패: ${filePath}`, err);
        });
      });
    }

    // 3. 최종 이미지 목록 생성
    const existingImages = submissions[0].content_image_url ? JSON.parse(submissions[0].content_image_url) : [];
    const remainingImages = existingImages.filter(url => !imagesToDeleteParsed.includes(url));
    
    const newImageUrls = req.files ? req.files.map(file => `/${file.path.replace(/\\/g, "/")}`) : [];
    const finalImageUrls = [...remainingImages, ...newImageUrls];

    if (finalImageUrls.length === 0) {
      return res.status(400).json({ message: "이미지는 최소 1개 이상 필요합니다." });
    }
    if (finalImageUrls.length > 5) {
      return res.status(400).json({ message: "이미지는 최대 5개까지 가능합니다." });
    }
    
    const finalImageUrlsJson = JSON.stringify(finalImageUrls);

    // 4. 데이터베이스 업데이트
    await db.query(
      "UPDATE submissions SET content_text = ?, content_image_url = ? WHERE id = ?",
      [content, finalImageUrlsJson, submissionId]
    );

    // 5. 업데이트된 게시물 정보 반환
    const [updatedSubmissions] = await db.query(
      `SELECT id, user_id, content_text, content_image_url, created_at FROM submissions WHERE id = ?`,
      [submissionId]
    );

    const updatedSubmission = updatedSubmissions[0];
    const responseSubmission = {
      ...updatedSubmission,
      content: updatedSubmission.content_text,
      image_url: updatedSubmission.content_image_url,
    };

    res.status(200).json(responseSubmission);

  } catch (err) {
    console.error("게시물 수정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


export default router;