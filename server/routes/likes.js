import express from "express"
import db from "../db.js"
import authMiddleware from "../auth.js"

const router = express.Router()

// 좋아요 추가
router.post("/", authMiddleware, async (req, res) => {
  console.log("LIKE BODY:", req.body);
  try {
    const { submissionId } = req.body
    const userId = req.user.userId

    // Check if the user is trying to like their own post
    const [submissionAuthor] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId]);
    if (submissionAuthor.length > 0 && submissionAuthor[0].user_id === userId) {
      return res.status(400).json({ message: "자신의 게시물에는 좋아요를 누를 수 없습니다." });
    }

    const [existingLike] = await db.query("SELECT 1 FROM likes WHERE submission_id = ? AND user_id = ?", [
      submissionId,
      userId,
    ])

    if (existingLike.length > 0) {
      return res.status(400).json({ message: "이미 좋아요했습니다" })
    }

    await db.query("INSERT INTO likes (submission_id, user_id) VALUES (?, ?)", [submissionId, userId])

    // 알림 생성
    const [submissions] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId])

    if (submissions.length > 0 && submissions[0].user_id !== userId) {
      const recipientId = submissions[0].user_id;
      const groupingKey = `like-submission-${submissionId}`; 
      const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000); 

      // 1. 지난 1분 이내에 동일한 그룹화 키를 가진 알림이 있는지 찾기
      const [existingGroupNotifications] = await db.query(
        `SELECT id, actors, created_at FROM notifications
        WHERE recipient_id = ? AND grouping_key = ? AND type = 'like_group' AND created_at >= ?
        ORDER BY created_at DESC LIMIT 1`,
        [recipientId, groupingKey, ONE_MINUTE_AGO]
      );

      // 2. 알림 메시지를 생성할 sender (닉네임) 정보 가져오기
      const [senderInfo] = await db.query("SELECT nickname FROM users WHERE id = ?", [userId]);
      const senderNickname = senderInfo.length > 0 ? senderInfo[0].nickname : "알 수 없는 사용자";

      if (existingGroupNotifications.length > 0) {
        const existingNotif = existingGroupNotifications[0];
        let actors = [];
        if (typeof existingNotif.actors === 'string') {
            try {
                const parsedActors = JSON.parse(existingNotif.actors);
                if (Array.isArray(parsedActors)) {
                    actors = parsedActors;
                } else {
                    console.warn("[POST /likes] notif.actors가 JSON 문자열이지만 배열 형태가 아님:", existingNotif.actors);
                }
            } catch (jsonErr) {
                console.error("[POST /likes] JSON 파싱 오류 (actors 컬럼):", existingNotif.actors, jsonErr);
            }
        } else if (Array.isArray(existingNotif.actors)) { 
            actors = existingNotif.actors;
        } else {
            console.warn("[POST /likes] notif.actors가 예상치 못한 타입:", typeof existingNotif.actors, existingNotif.actors);
        }

        if (!actors.includes(senderNickname)) {
          actors.push(senderNickname);
        }

        let message = '';
        if (actors.length === 1) {
          message = `${actors[0]}님이 회원님의 게시물을 좋아합니다.`;
        } else if (actors.length === 2) {
          message = `${actors[0]}님과 ${actors[1]}님이 회원님의 게시물을 좋아합니다.`;
        } else {
          message = `${actors[0]}님 외 ${actors.length - 1}명이 회원님의 게시물을 좋아합니다.`;
        }

        await db.query(
          `UPDATE notifications SET message = ?, actors = ?, created_at = NOW()
          WHERE id = ?`,
          [message, JSON.stringify(actors), existingNotif.id]
        );
      } else {
        const actors = [senderNickname];
        const message = `${senderNickname}님이 회원님의 게시물을 좋아합니다.`;

        await db.query(
          `INSERT INTO notifications (recipient_id, sender_id, type, target_type, target_id, message, grouping_key, actors)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            recipientId,
            userId,
            "like_group", 
            "SUBMISSION",
            submissionId,
            message,
            groupingKey,
            JSON.stringify(actors),
          ]
        );
      }
    }

res.status(201).json({ message: "좋아요 성공", isLiked: true });
  } catch (err) {
    console.error("좋아요 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
})

// 좋아요 제거
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.body;
    const userId = req.user.userId;

    const [deleteQueryResult] = await db.query("DELETE FROM likes WHERE submission_id = ? AND user_id = ?", [submissionId, userId]);
    console.log(`[DELETE /likes] DB DELETE Query Result:`, deleteQueryResult); // 디버깅 로그

    if (deleteQueryResult.affectedRows > 0) {
      // --- '좋아요' 그룹 알림 업데이트 로직 ---
      const [submissionAuthor] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId]);
      if (submissionAuthor.length > 0) {
        const recipientId = submissionAuthor[0].user_id;
        const groupingKey = `like-submission-${submissionId}`;

        // 1. 취소하려는 '좋아요'와 관련된 그룹 알림 찾기
        const [groupNotifications] = await db.query(
          `SELECT id, actors FROM notifications WHERE recipient_id = ? AND grouping_key = ? AND type = 'like_group' LIMIT 1`,
          [recipientId, groupingKey]
        );

        if (groupNotifications.length > 0) {
          const notif = groupNotifications[0];
          const [cancelerInfo] = await db.query("SELECT nickname FROM users WHERE id = ?", [userId]);
          const cancelerNickname = cancelerInfo.length > 0 ? cancelerInfo[0].nickname : null;

          if (cancelerNickname) {
            let actors = [];
            // notif.actors가 이미 객체/배열인지 확인, 아니면 파싱 시도
            if (typeof notif.actors === 'string') {
                try {
                    const parsedActors = JSON.parse(notif.actors);
                    if (Array.isArray(parsedActors)) {
                        actors = parsedActors;
                    } else {
                        console.warn("[DELETE /likes] notif.actors가 JSON 문자열이지만 배열 형태가 아님:", notif.actors);
                    }
                } catch (jsonErr) {
                    console.error("[DELETE /likes] JSON 파싱 오류 (actors 컬럼):", notif.actors, jsonErr);
                    // 파싱 오류 발생 시 actors는 이미 빈 배열로 초기화되어 있음
                }
            } else if (Array.isArray(notif.actors)) { // 이미 배열로 넘어온 경우
                actors = notif.actors;
            } else {
                console.warn("[DELETE /likes] notif.actors가 예상치 못한 타입:", typeof notif.actors, notif.actors);
            }
            actors = actors.filter(actor => actor !== cancelerNickname);

            const message = actors.length === 0
              ? null
              : actors.length === 1
                ? `${actors[0]}님이 회원님의 게시물을 좋아합니다.`
                : actors.length === 2
                  ? `${actors[0]}님과 ${actors[1]}님이 회원님의 게시물을 좋아합니다.`
                  : `${actors[0]}님 외 ${actors.length - 1}명이 회원님의 게시물을 좋아합니다.`;

            if (actors.length === 0) {
              await db.query("DELETE FROM notifications WHERE id = ?", [notif.id]);
            } else {
              await db.query("UPDATE notifications SET message = ?, actors = ? WHERE id = ?", [message, JSON.stringify(actors), notif.id]);
            }
          }
        }
      }
    }

    res.status(200).json({ message: "좋아요 제거 성공", isLiked: false });
  } catch (err) {
    console.error("좋아요 제거 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router
