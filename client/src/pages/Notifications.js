"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ChatIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail"; // @ 아이콘 임포트

// This function processes notifications to group multiple comments on the same post
const processNotifications = (notifications) => {
  const commentGroups = new Map();
  const otherNotifications = [];

  // Separate comment notifications and group them by post (target_id)
  for (const notif of notifications) {
    if (notif.type === "comment") {
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
    const uniqueCommentersMap = new Map(group.map((n) => [n.fromUserName, n]));

    if (group.length > 1 && uniqueCommentersMap.size > 1) {
      group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const latest = group[0];
      const is_read = group.every((n) => n.is_read);

      const uniqueNames = Array.from(uniqueCommentersMap.keys());
      // Ensure the latest commenter always appears first in the list
      const sortedUniqueNames = [
        latest.fromUserName,
        ...uniqueNames.filter((name) => name !== latest.fromUserName),
      ];

      processedNotifications.push({
        id: `group-${target_id}`,
        type: "multiple_comments",
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
  processedNotifications.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
  return processedNotifications;
};

const Notifications = ({ currentUser, onUpdateUnreadCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [processedNotifications, setProcessedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();
  const observerRef = useRef(null);

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loadingMore) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, loadingMore],
  );

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const fetchNotifications = useCallback(async () => {
    setLoadingMore(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_ADDR}/notifications?page=${page}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (response.ok) {
        setNotifications((prev) =>
          page === 1 ? data.notifications : [...prev, ...data.notifications],
        );
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error("알림 로드 실패:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => {
    // 페이지가 변경될 때마다 알림을 가져옵니다.
    fetchNotifications();
  }, [page, fetchNotifications]);

  useEffect(() => {
    // 컴포넌트 마운트 시 타이머 기록 및 첫 페이지 로드
    const recordEntryTimeAndFetch = async () => {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${process.env.REACT_APP_ADDR}/notifications/start-read-timers`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("알림 탭 진입 시간 기록 실패:", err);
      }
    };
    recordEntryTimeAndFetch();
  }, []);

  useEffect(() => {
    // `notifications` 상태가 변경될 때마다 `processedNotifications`를 업데이트합니다.
    setProcessedNotifications(processNotifications(notifications));
  }, [notifications]);

  const handleMarkAsRead = async (notification) => {
    const notificationsToMark =
      notification.type === "multiple_comments"
        ? notification.original_notifications.filter((n) => !n.is_read)
        : [notification].filter((n) => !n.is_read);

    if (notificationsToMark.length === 0) return;

    const idsToMark = notificationsToMark.map((n) => n.id);

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        idsToMark.map((id) =>
          fetch(`${process.env.REACT_APP_ADDR}/notifications/${id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );

      // 상태를 다시 로드하여 UI를 업데이트합니다.
      if (page === 1) {
        fetchNotifications();
      } else {
        setPage(1); // 1페이지로 리셋하면 useEffect가 실행되어 데이터를 다시 가져옵니다.
      }
      onUpdateUnreadCount(); // 부모 컴포넌트의 unreadCount도 업데이트합니다.
    } catch (err) {
      console.error("알림 읽음 표시 실패:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification);
    if (
      notification.type === "like" ||
      notification.type === "like_group" ||
      notification.type === "comment" ||
      notification.type === "comment_group" ||
      notification.type === "multiple_comments" ||
      notification.type === "mention"
    ) {
      navigate(
        `/?openSubmission=${notification.target_id}&highlightComment=${notification.comment_id || 0}`,
      );
    } else if (notification.type === "follow") {
      navigate(`/profile/${notification.sender_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
      case "like_group":
        return <ThumbUpIcon sx={{ color: "#EC4899" }} />;
      case "comment":
      case "comment_group":
      case "multiple_comments":
        return <ChatIcon sx={{ color: "#6366F1" }} />;
      case "follow":
        return <PersonAddIcon sx={{ color: "#10B981" }} />;
      case "mention":
        return <AlternateEmailIcon sx={{ color: "#3B82F6" }} />;
      default:
        return null;
    }
  };

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
  };

  const getPrimaryText = (notification) => {
    if (notification.type === "multiple_comments") {
      const firstCommenter = notification.commenters[0];
      return (
        <Typography variant="body2">
          <strong>{firstCommenter}</strong>
          {getNotificationMessage(notification)}
        </Typography>
      );
    }
    return (
      <Typography variant="body2">
        <strong>{notification.fromUserName}</strong>
        {getNotificationMessage(notification)}
      </Typography>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          알림
        </Typography>
        <Tooltip
          title={
            <Typography variant="body2" sx={{ p: 1 }}>
              • 읽지 않은 알림은 1시간 뒤 자동으로 읽음 처리됩니다.
              <br />
              <br />
              • 읽은 알림은 30일이 지나면 삭제될 수 있으나, 최신 50개는 항상
              보관됩니다.
              <br />
              <br />• 읽지 않은 알림은 90일이 지나면 영구적으로 삭제됩니다.
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

      {processedNotifications.length === 0 && !loadingMore ? (
        <Alert severity="info">새로운 알림이 없습니다</Alert>
      ) : (
        <List>
          {processedNotifications.map((notification) => (
            <ListItem
              key={notification.id}
              sx={{
                backgroundColor: notification.is_read ? "transparent" : "#F3F4F6",
                marginBottom: 1,
                borderRadius: 1.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between", // 아이콘과 텍스트 간격 확보
                px: 1.5,
                py: 1,
                "&:hover": {
                  backgroundColor: "#E5E7EB",
                  boxShadow: notification.is_read
                    ? "none"
                    : "0 2px 6px rgba(0,0,0,0.1)", // 읽지 않은 알림 강조
                },
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ListItemAvatar>
                  <Avatar
                    src={notification.fromUserProfileImage}
                    alt={
                      notification.type === "multiple_comments"
                        ? notification.commenters[0]
                        : notification.fromUserName
                    }
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={getPrimaryText(notification)}
                  secondary={new Date(notification.created_at).toLocaleString(
                    "ko-KR",
                    {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                  sx={{ 
                    "& .MuiListItemText-primary": { fontWeight: 500 },
                    "& .MuiListItemText-secondary": { color: "text.secondary", fontSize: 13 },
                  }}
                />
              </Box>
              <Box sx={{ ml: 2 }}>{getNotificationIcon(notification.type)}</Box>
            </ListItem>
          ))}
        </List>
      )}
      <div ref={observerRef} style={{ height: "1px" }} />
      {loadingMore && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {!hasMore && notifications.length > 0 && (
        <Typography
          sx={{ textAlign: "center", my: 2, color: "text.secondary" }}
        >
          더 이상 알림이 없습니다.
        </Typography>
      )}
    </Container>
  );
};

export default Notifications;
