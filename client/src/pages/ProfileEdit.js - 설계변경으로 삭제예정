"use client"

import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Box, TextField, Button, Typography, Paper, Alert, CircularProgress } from "@mui/material"

const ProfileEdit = ({ currentUser }) => {
  const bioRef = useRef()
  const profileImageRef = useRef()
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [currentProfile, setCurrentProfile] = useState(null)

  useEffect(() => {
    fetchCurrentProfile()
  }, [])

  const fetchCurrentProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const userId = localStorage.getItem("userId")
      const response = await fetch(`http://localhost:3010/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setCurrentProfile(data.user)
        bioRef.current.value = data.user.bio || ""
      }
    } catch (err) {
      console.error("프로필 로드 실패:", err)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdate = async () => {
    setError("")
    const bio = bioRef.current.value
    const file = profileImageRef.current.files[0]

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("bio", bio)
      if (file) {
        formData.append("profileImage", file)
      }

      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/users/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "프로필 수정 실패")
        return
      }

      navigate(`/profile/${currentUser?.userId}`)
    } catch (err) {
      setError("서버 연결 오류")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", paddingY: 2 }}>
        <Paper sx={{ width: "100%", padding: 4 }}>
          <Typography variant="h5" component="h1" sx={{ textAlign: "center", marginBottom: 3, fontWeight: "bold" }}>
            프로필 수정
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ textAlign: "center", marginBottom: 2 }}>
            {preview ? (
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : currentProfile?.profileImage ? (
              <Box
                component="img"
                src={currentProfile.profileImage}
                alt="Current"
                sx={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : null}
          </Box>

          <Button variant="outlined" component="label" fullWidth sx={{ marginBottom: 2 }}>
            프로필 사진 변경
            <input hidden type="file" inputRef={profileImageRef} onChange={handleImageChange} accept="image/*" />
          </Button>

          <TextField
            fullWidth
            label="자기소개"
            multiline
            rows={4}
            inputRef={bioRef}
            margin="normal"
            variant="outlined"
            placeholder="자신을 소개해주세요"
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ marginTop: 2, backgroundColor: "#6366F1" }}
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "수정 중..." : "수정 완료"}
          </Button>

          <Box sx={{ textAlign: "center", marginTop: 2 }}>
            <Button
              color="primary"
              onClick={() => navigate(`/profile/${currentUser?.userId}`)}
              sx={{ textTransform: "none" }}
            >
              취소
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default ProfileEdit