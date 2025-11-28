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
} from "@mui/material"
import ThumbUpIcon from "@mui/icons-material/ThumbUp"
import ChatIcon from "@mui/icons-material/Chat"
import PersonAddIcon from "@mui/icons-material/PersonAdd"

const Notifications = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
  }, [])

  
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setNotifications(data)
      }
    } catch (err) {
      console.error("알림 로드 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3010/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setNotifications(
          notifications.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)),
        )
      }
    } catch (err) {
      console.error("알림 읽음 표시 실패:", err)
    }
  }

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification.id); 
    if (notification.type === 'like') { 
      navigate(`/?openSubmission=${notification.target_id}`); 
    } else if (notification.type === 'comment') { 
      navigate(`/?openSubmission=${notification.target_id}&highlightComment=${notification.comment_id}`); 
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.sender_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <ThumbUpIcon sx={{ color: "#EC4899" }} />
      case "comment":
        return <ChatIcon sx={{ color: "#6366F1" }} />
      case "follow":
        return <PersonAddIcon sx={{ color: "#6366F1" }} />
      default:
        return null
    }
  }

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case "like":
        return `님이 당신의 게시물을 좋아했습니다`
      case "comment":
        return `님이 당신의 게시물에 댓글을 달았습니다`
      case "follow":
        return `님이 당신을 팔로우했습니다`
      default:
        return ""
    }
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
      <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: "bold" }}>
        알림
      </Typography>

      {notifications.length === 0 ? (
        <Alert severity="info">새로운 알림이 없습니다</Alert>
      ) : (
        <List>
          {notifications.map((notification) => (
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
                <Avatar src={notification.fromUserProfileImage} alt={notification.fromUserName} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    <strong>{notification.fromUserName}</strong>
                    {getNotificationMessage(notification)}
                  </Typography>
                }
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