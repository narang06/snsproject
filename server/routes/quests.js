import express from "express";
import db from "../db.js";
import authMiddleware from "../auth.js";
import { addResolvedMentions } from "../utils/mentionUtils.js";

const router = express.Router();

// 오늘의 퀘스트 조회 (제출물 제외)
router.get("/today", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split("T")[0];

    // 1. 오늘의 Daily Quest 조회
    let [dailyQuests] = await db.query(
      "SELECT id, quest_id FROM daily_quests WHERE date = ?",
      [today],
    );

    // 2. 오늘의 퀘스트가 없으면 새로 생성
    if (dailyQuests.length === 0) {
      // 2a. 최근 30일 내에 사용되지 않은 퀘스트를 랜덤으로 선택
      const [randomQuests] = await db.query(
        `SELECT id FROM quests
         WHERE id NOT IN (
           SELECT quest_id FROM daily_quests WHERE date > CURDATE() - INTERVAL 30 DAY
         )
         ORDER BY RAND()
         LIMIT 1`,
      );

      let newQuestId;
      if (randomQuests.length > 0) {
        newQuestId = randomQuests[0].id;
      } else {
        // 모든 퀘스트가 최근 30일 내에 사용되었다면, 그냥 아무거나 랜덤으로 선택
        const [anyRandomQuest] = await db.query(
          "SELECT id FROM quests ORDER BY RAND() LIMIT 1",
        );
        if (anyRandomQuest.length === 0) {
          return res.status(404).json({ message: "DB에 퀘스트가 없습니다." });
        }
        newQuestId = anyRandomQuest[0].id;
      }

      // 2b. 'daily_quests' 테이블에 새로 등록
      await db.query(
        "INSERT INTO daily_quests (quest_id, date) VALUES (?, ?)",
        [newQuestId, today],
      );

      // 2c. 방금 생성된 오늘의 퀘스트를 다시 조회
      [dailyQuests] = await db.query(
        "SELECT id, quest_id FROM daily_quests WHERE date = ?",
        [today],
      );
    }

    const dailyQuest = dailyQuests[0];
    const dailyQuestId = dailyQuest.id; // 오늘의 퀘스트 자체의 ID
    const questId = dailyQuest.quest_id; // 퀘스트 내용의 ID

    // 3. 퀘스트 정보 조회
    const [quests] = await db.query(
      "SELECT id, title, description FROM quests WHERE id = ?",
      [questId],
    );
    if (quests.length === 0) {
      return res
        .status(404)
        .json({ message: "퀘스트 정보를 찾을 수 없습니다." });
    }

    // 4. 사용자가 이미 제출했는지 확인
    const [userSubmission] = await db.query(
      "SELECT id FROM submissions WHERE daily_quest_id = ? AND user_id = ?",
      [dailyQuestId, userId],
    );

    res.status(200).json({
      quest: {
        ...quests[0],
        dailyQuestId: dailyQuestId,
      },
      hasSubmitted: userSubmission.length > 0,
    });
  } catch (err) {
    console.error("오늘의 퀘스트 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 오늘의 퀘스트에 대한 제출물
router.get("/today/submissions", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; 
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "5", 10);
    const offset = (page - 1) * limit;

    const today = new Date().toISOString().split("T")[0];

    // 1. 오늘의 Daily Quest ID 조회
    const [dailyQuests] = await db.query(
      "SELECT id FROM daily_quests WHERE date = ?",
      [today],
    );

    if (dailyQuests.length === 0) {
      return res.status(200).json({ submissions: [], hasMore: false });
    }
    const dailyQuestId = dailyQuests[0].id;

    // 2. 해당 Daily Quest의 제출물 총 개수 조회
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM submissions WHERE daily_quest_id = ?",
      [dailyQuestId],
    );

    // 3. 페이지에 해당하는 제출물 조회 (+ isLiked 계산 추가)
    const [submissions] = await db.query(
      `SELECT 
          s.id,
          s.user_id,
          s.content_text AS content,
          s.content_image_url AS image_url,
          s.created_at,
          u.nickname,
          u.nickname_tag,
          u.profile_image_url AS profile_image,
          COUNT(DISTINCT l.user_id) AS likeCount,
          COUNT(DISTINCT c.id) AS commentCount,
          MAX(CASE WHEN l_user.user_id IS NOT NULL THEN 1 ELSE 0 END) AS isLiked  
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN likes l ON s.id = l.submission_id
       LEFT JOIN comments c ON s.id = c.submission_id
       LEFT JOIN likes l_user 
         ON s.id = l_user.submission_id AND l_user.user_id = ?              
       WHERE s.daily_quest_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT ?
       OFFSET ?`,
      [userId, dailyQuestId, limit, offset],                                 
    );

    // 멘션 처리
    const submissionsWithMentions = await addResolvedMentions(submissions);
    const submissionsWithExtraData = submissionsWithMentions.map((s) => ({
      ...s,
      userProfileImage: s.profile_image,
    }));

    res.status(200).json({
      submissions: submissionsWithExtraData,
      hasMore: total > page * limit,
    });
  } catch (err) {
    console.error("오늘의 퀘스트 제출물 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});


// 지난 퀘스트 아카이브 (페이지네이션)
router.get("/archive", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "15", 10);
    const offset = (page - 1) * limit;

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM quests WHERE DATE(created_at) < CURDATE()",
    );

    const [quests] = await db.query(
      `SELECT id, title, description, created_at
       FROM quests
       WHERE DATE(created_at) < CURDATE()
       ORDER BY created_at DESC
       LIMIT ?
       OFFSET ?`,
      [limit, offset],
    );

    res.status(200).json({
      quests,
      hasMore: total > page * limit,
    });
  } catch (err) {
    console.error("아카이브 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
