import cron from 'node-cron';
import db from './db.js';

const BATCH_SIZE = 100; // 한 번에 처리할 사용자 수

// --- 규칙 1: 아주 오래된 "읽지 않은" 알림 삭제 ---
const deleteOldUnreadNotifications = async () => {
  try {
    console.log('[CRON] 시작: 3개월 이상된 읽지 않은 알림 삭제');
    const [result] = await db.query(
      `DELETE FROM notifications WHERE is_read = 0 AND created_at < NOW() - INTERVAL 3 MONTH`
    );
    console.log(`[CRON] 완료: ${result.affectedRows}개의 오래된 읽지 않은 알림 삭제됨`);
  } catch (err) {
    console.error('[CRON] 오류: 오래된 읽지 않은 알림 삭제 실패', err);
  }
};

// --- 규칙 2: 오래된 "읽은" 알림 삭제 (최소 50개 보장) ---
const deleteOldReadNotifications = async () => {
  try {
    console.log('[CRON] 시작: 오래된 읽은 알림 삭제 (최소 50개 보장)');

    // 1. 알림이 50개 이상인 사용자 ID 목록 조회
    const [usersToDelete] = await db.query(
      `SELECT recipient_id FROM notifications GROUP BY recipient_id HAVING COUNT(*) > 50`
    );

    if (usersToDelete.length === 0) {
      console.log('[CRON] 정보: 알림이 50개 이상인 사용자가 없습니다.');
      return;
    }

    const userIds = usersToDelete.map(u => u.recipient_id);
    let totalDeletedCount = 0;

    // 2. 사용자 ID 목록을 배치로 나누어 처리
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);

      // 3. 각 배치의 사용자에 대해 삭제 로직 실행
      for (const userId of batch) {
        // 이 사용자의 총 알림 개수 다시 확인 (정확성을 위해)
        const [[{ total_count }]] = await db.query(
          `SELECT COUNT(*) as total_count FROM notifications WHERE recipient_id = ?`,
          [userId]
        );

        if (total_count > 50) {
          const limit = total_count - 50;
          const [deleteResult] = await db.query(
            `DELETE FROM notifications
             WHERE recipient_id = ?
               AND is_read = 1
               AND created_at < NOW() - INTERVAL 30 DAY
             ORDER BY created_at ASC
             LIMIT ?`,
            [userId, limit]
          );
          totalDeletedCount += deleteResult.affectedRows;
        }
      }
    }
    console.log(`[CRON] 완료: 총 ${totalDeletedCount}개의 오래된 읽은 알림 삭제됨`);
  } catch (err) {
    console.error('[CRON] 오류: 오래된 읽은 알림 삭제 실패', err);
  }
};


// --- Cron Job 스케줄러 정의 ---
export const startNotificationCleanupJob = () => {
  // 매일 새벽 3시에 실행
  cron.schedule('0 3 * * *', async () => {
    console.log('--- 알림 정리 작업 시작 ---');
    await deleteOldUnreadNotifications();
    await deleteOldReadNotifications();
    console.log('--- 알림 정리 작업 종료 ---');
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });

  console.log('알림 정리 Cron Job이 등록되었습니다.');
};