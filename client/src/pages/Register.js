"use client"

import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Box, TextField, Button, Typography, Paper, Alert } from "@mui/material"

const Register = () => {
  const bioRef = useRef()
  const profileImageRef = useRef()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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

  const handleRegister = async () => {
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
      const response = await fetch(`${process.env.REACT_APP_ADDR}/users/profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "프로필 설정 실패")
        return
      }

      navigate("/")
    } catch (err) {
      setError("서버 연결 오류")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Paper sx={{ width: "100%", padding: 4 }}>
          <Typography variant="h5" component="h1" sx={{ textAlign: "center", marginBottom: 3, fontWeight: "bold" }}>
            프로필 설정
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ textAlign: "center", marginBottom: 2 }}>
            {preview && (
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
              />
            )}
          </Box>

          <Button variant="outlined" component="label" fullWidth sx={{ marginBottom: 2 }}>
            프로필 사진 선택
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
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "설정 중..." : "완료"}
          </Button>

          <Box sx={{ textAlign: "center", marginTop: 2 }}>
            <Button color="primary" onClick={() => navigate("/")} sx={{ textTransform: "none" }}>
              나중에 하기
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Register