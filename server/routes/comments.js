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

    // 새로 생성된 댓글 조회 (프로필 이미지 URL 추가)
    const [newComments] = await db.query(
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag, u.profile_image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId],
    )

    // 알림 생성 (notifications 테이블 스키마에 맞춰 수정)
    const [submissions] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId])

    if (submissions.length > 0 && submissions[0].user_id !== userId) {
      await db.query(
        "INSERT INTO notifications (recipient_id, sender_id, type, target_type, target_id) VALUES (?, ?, ?, ?, ?)",
        [
          submissions[0].user_id, // 게시물 주인 (알림 받는 사람)
          userId, // 댓글 단 사람 (알림 보낸 사람)
          "COMMENT", // 알림 타입
          "SUBMISSION", // 대상 타입
          submissionId, // 대상 ID (댓글이 달린 게시물)
        ]
      )
    }

    res.status(201).json(newComments[0])
  } catch (err) {
    console.error("댓글 생성 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

export default router
