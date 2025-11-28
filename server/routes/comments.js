import express from "express"
import db from "../db.js"
import authMiddleware from "../auth.js"

const router = express.Router()

// 댓글 조회
router.get("/submission/:submissionId", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params

    const [comments] = await db.query(
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag, u.profile_image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.submission_id = ?
       ORDER BY c.created_at ASC`,
      [submissionId],
    )

    res.status(200).json(comments)
  } catch (err) {
    console.error("댓글 조회 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

// 댓글 생성
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { submissionId, content } = req.body

    if (!submissionId || !content) {
      return res.status(400).json({ message: "필수 필드를 입력해주세요" })
    }

    const result = await db.query("INSERT INTO comments (submission_id, user_id, content) VALUES (?, ?, ?)", [
      submissionId,
      userId,
      content,
    ])

    const commentId = result[0].insertId

    // 새로 생성된 댓글 조회 
    const [newComments] = await db.query(
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag, u.profile_image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId],
    )

    // 알림 생성
    const [submissions] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId])

    if (submissions.length > 0 && submissions[0].user_id !== userId) {
      await db.query(
        "INSERT INTO notifications (recipient_id, sender_id, type, target_type, target_id, comment_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          submissions[0].user_id, 
          userId, 
          "comment",
          "SUBMISSION", 
          submissionId, 
          commentId,
        ]
      )
    }

    res.status(201).json(newComments[0])
  } catch (err) {
    console.error("댓글 생성 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

// 댓글 삭제
router.delete("/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const [comments] = await db.query("SELECT user_id FROM comments WHERE id = ?", [commentId]);

    if (comments.length === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: "댓글을 삭제할 권한이 없습니다." });
    }

    await db.query("DELETE FROM comments WHERE id = ?", [commentId]);

    res.status(200).json({ message: "댓글이 삭제되었습니다." });
  } catch (err) {
    console.error("댓글 삭제 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 댓글 수정
router.put("/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "댓글 내용을 입력해주세요." });
    }
    if (content.trim().length > 500) {
      return res.status(400).json({ message: "댓글 내용은 500자를 초과할 수 없습니다." });
    }
    
    const [comments] = await db.query("SELECT user_id FROM comments WHERE id = ?", [commentId]);

    if (comments.length === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: "댓글을 수정할 권한이 없습니다." });
    }

    await db.query("UPDATE comments SET content = ? WHERE id = ?", [content, commentId]);

    const [updatedComments] = await db.query(
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag, u.profile_image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId],
    );

    res.status(200).json(updatedComments[0]);
  } catch (err) {
    console.error("댓글 수정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router
