"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Container,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,   
} from "@mui/material"
import ThumbUpIcon from "@mui/icons-material/ThumbUp"
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ChatIcon from "@mui/icons-material/Chat"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail"; // @ 아이콘 임포트

// This function processes notifications to group multiple comments on the same post
const processNotifications = (notifications) => {
  const commentGroups = new Map();
  const otherNotifications = [];

  // Separate comment notifications and group them by post (target_id)
  for (const notif of notifications) {
      if (notif.type === 'comment') {
          if (!commentGroups.has(notif.target_id)) {
              commentGroups.set(notif.target_id, []);
          }
          commentGroups.get(notif.target_id).push(notif);
      } else {
          otherNotifications.push(notif);
      }
  }

  const processedNotifications = [...otherNotifications];

  // Create summary notifications for groups with more than one unique commenter
  for (const [target_id, group] of commentGroups.entries()) {
    const uniqueCommentersMap = new Map(group.map(n => [n.fromUserName, n]));

    if (group.length > 1 && uniqueCommentersMap.size > 1) {
        group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latest = group[0];
        const is_read = group.every(n => n.is_read);
        
        const uniqueNames = Array.from(uniqueCommentersMap.keys());
        // Ensure the latest commenter always appears first in the list
        const sortedUniqueNames = [latest.fromUserName, ...uniqueNames.filter(name => name !== latest.fromUserName)];

        processedNotifications.push({
            id: `group-${target_id}`,
            type: 'multiple_comments',
            target_id: target_id,
            is_read: is_read,
            created_at: latest.created_at,
            fromUserProfileImage: latest.fromUserProfileImage, // Show latest commenter's avatar
            commenters: sortedUniqueNames,
            original_notifications: group,
            comment_id: latest.comment_id,
        });
    } else {
      // If there's only one unique commenter, show individual notifications
      processedNotifications.push(...group);
    }
  }

  // Sort the final list by date to show the most recent notifications first
  processedNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return processedNotifications;
};


const Notifications = ({ currentUser, onUpdateUnreadCount }) => {
  const [rawNotifications, setRawNotifications] = useState([]); // Store original notifications
  const [processedNotifications, setProcessedNotifications] = useState([]); // Store grouped notifications for display
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const recordEntryTimeAndFetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        // 알림 탭 진입 시간 기록 API 호출
        await fetch("http://localhost:3010/notifications/start-read-timers", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });

        // 알림 목록 조회
        fetchNotifications();

      } catch (err) {
        console.error("알림 탭 진입 시간 기록 또는 목록 조회 실패:", err);
        fetchNotifications();
      }
    };

    recordEntryTimeAndFetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setRawNotifications(data);
        setProcessedNotifications(processNotifications(data));
      }
    } catch (err) {
      console.error("알림 로드 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notification) => {
    const notificationsToMark = notification.type === 'multiple_comments'
      ? notification.original_notifications.filter(n => !n.is_read)
      : [notification].filter(n => !n.is_read);

    if (notificationsToMark.length === 0) return;

    const idsToMark = notificationsToMark.map(n => n.id);

    try {
      const token = localStorage.getItem("token");
      // Inefficiently marking as read one by one. A bulk-update API would be better.
      await Promise.all(idsToMark.map(id =>
        fetch(`http://localhost:3010/notifications/${id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
      
      const updatedRawNotifications = rawNotifications.map((notif) =>
        idsToMark.includes(notif.id) ? { ...notif, is_read: true } : notif
      );
      setRawNotifications(updatedRawNotifications);
      setProcessedNotifications(processNotifications(updatedRawNotifications));
      onUpdateUnreadCount(); // 부모에게 알림 개수 다시 세도록 요청

    } catch (err) {
      console.error("알림 읽음 표시 실패:", err)
    }
  }

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification);
      if (notification.type === 'like' || notification.type === 'like_group' || notification.type === 'comment' || notification.type ==='comment_group' 
        || notification.type === 'multiple_comments' || notification.type === 'mention') { 
      navigate(`/?openSubmission=${notification.target_id}&highlightComment=${notification.comment_id || 0}`);
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.sender_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
      case "like_group":
        return <ThumbUpIcon sx={{ color: "#EC4899" }} />
      case "comment":
      case "comment_group":
      case "multiple_comments":
        return <ChatIcon sx={{ color: "#6366F1" }} />
      case "follow":
        return <PersonAddIcon sx={{ color: "#10B981" }} />
      case "mention":
        return <AlternateEmailIcon sx={{ color: "#3B82F6" }} />
      default:
        return null
    }
  }
  
  const getNotificationMessage = (notification) => {
    switch (notification.type) {
        case "like":
        case "like_group": // 이 부분 추가
            return `님이 당신의 게시물을 좋아했습니다`;
        case "comment":
        case "comment_group": // 이 부분 추가
            return `님이 당신의 게시물에 댓글을 달았습니다`;
        case "follow":
            return `님이 당신을 팔로우했습니다`;
        case "mention":
            if (notification.comment_id) {
              return `님이 댓글에서 회원님을 언급했습니다`;
            }
            return `님이 게시물에서 회원님을 언급했습니다`;
        case "multiple_comments":
            const commenters = notification.commenters;
            const otherCommentersCount = commenters.length - 1;
            if (otherCommentersCount > 1) {
                return `님 외 ${otherCommentersCount}명이 당신의 게시물에 댓글을 달았습니다`;
            } else if (otherCommentersCount === 1) {
                return `님과 ${commenters[1]}님이 당신의 게시물에 댓글을 달았습니다`;
            }
            return `님이 여러 번 댓글을 달았습니다`; // Fallback
        default:
            return "";
    }
  }
  
  const getPrimaryText = (notification) => {
    if (notification.type === 'multiple_comments') {
        const firstCommenter = notification.commenters[0];
        return (
          <Typography variant="body2">
              <strong>{firstCommenter}</strong>
              {getNotificationMessage(notification)}
          </Typography>
        )
    }
    return (
      <Typography variant="body2">
          <strong>{notification.fromUserName}</strong>
          {getNotificationMessage(notification)}
      </Typography>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold" }}>
        알림
      </Typography>
      <Tooltip
        title={
          <Typography variant="body2" sx={{ p: 1 }}>
            • 읽지 않은 알림은 1시간 뒤 자동으로 읽음 처리됩니다.<br/><br/>
            • 읽은 알림은 30일이 지나면 삭제될 수 있으나, 최신 50개는 항상 보관됩니다.<br/><br/>
            • 읽지 않은 알림은 90일이 지나면 영구적으로 삭제됩니다.
          </Typography>
        }
        placement="right"
        arrow
      >
        <IconButton size="small" sx={{ marginLeft: 1 }}>
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>

      {processedNotifications.length === 0 ? (
        <Alert severity="info">새로운 알림이 없습니다</Alert>
      ) : (
        <List>
          {processedNotifications.map((notification) => (
            <ListItem
              key={notification.id}
              sx={{
                backgroundColor: notification.is_read ? "transparent" : "#F3F4F6",
                marginBottom: 1,
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": { backgroundColor: "#E5E7EB" },
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <ListItemAvatar>
                <Avatar src={notification.fromUserProfileImage} alt={notification.type === 'multiple_comments' ? notification.commenters[0] : notification.fromUserName} />
              </ListItemAvatar>
              <ListItemText
                primary={getPrimaryText(notification)}
                secondary={
                  new Date(notification.created_at).toLocaleString('ko-KR', {
                    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                }
              />
              <Box sx={{ marginLeft: 1 }}>{getNotificationIcon(notification.type)}</Box>
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  )
}

export default Notifications