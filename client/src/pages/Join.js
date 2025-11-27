"use client"

import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Box, TextField, Button, Typography, Paper, Alert, Avatar } from "@mui/material"

const Join = () => {
  const nicknameRef = useRef()
  const emailRef = useRef()
  const passwordRef = useRef()
  const passwordConfirmRef = useRef()
  const [bio, setBio] = useState("");
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const navigate = useNavigate()

  const handleJoin = async () => {
    setError("")
    const nickname = nicknameRef.current.value
    const email = emailRef.current.value
    const password = passwordRef.current.value
    const passwordConfirm = passwordConfirmRef.current.value

    if (!nickname || !email || !password || !passwordConfirm) {
      setError("모든 필드를 입력해주세요.")
      return
    }

    if (bio && bio.length > 160) {
      setError("자기소개는 160자를 초과할 수 없습니다.");
      return;
    }
    
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData();
      formData.append("nickname", nickname);
      formData.append("email", email);
      formData.append("password", password);
      if (bio) {
        formData.append("bio", bio);
      }
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      const response = await fetch("http://localhost:3010/auth/join", {
        method: "POST",
        body: formData, 
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "회원가입 실패")
        return
      }

      const message = encodeURIComponent("회원가입이 완료되었습니다. 로그인해주세요.");
      navigate(`/login?message=${message}&type=success`);
    } catch (err) {
      setError("서버 연결 오류")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setProfileImageFile(null);
      setProfileImagePreview(null);
    }
  };


  return (
    <Container maxWidth="sm">
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Paper sx={{ width: "100%", padding: 4 }}>
          <Typography variant="h4" component="h1" sx={{ textAlign: "center", marginBottom: 3, fontWeight: "bold" }}>
            QUESTLY 가입
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginY: 2 }}>
            <Typography variant="body1" sx={{ marginBottom: 1 }}>프로필 이미지 (선택 사항)</Typography>
            {profileImagePreview ? (
              <Avatar src={profileImagePreview} sx={{ width: 100, height: 100, marginBottom: 2 }} />
            ) : (
              <Avatar sx={{ width: 100, height: 100, marginBottom: 2 }}>U</Avatar>
            )}
            <Button variant="outlined" component="label">
              이미지 선택
              <input type="file" hidden accept="image/*" onChange={handleProfileImageChange} />
            </Button>
          </Box>

          <TextField fullWidth label="닉네임" inputRef={nicknameRef} margin="normal" variant="outlined" />
          <TextField fullWidth label="이메일" type="email" inputRef={emailRef} margin="normal" variant="outlined" />
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            inputRef={passwordRef}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="비밀번호 확인"
            type="password"
            inputRef={passwordConfirmRef}
            margin="normal"
            variant="outlined"
          />

          <TextField
            fullWidth
            label="자기소개 (선택 사항)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            margin="normal"
            variant="outlined"
            multiline
            rows={3}
            slotProps={{ input: { maxLength: 160 } }}
            helperText={`${bio.length}/160 ${bio.length > 160 ? '(160자를 초과했습니다)' : ''}`}
            error={bio.length > 160}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ marginTop: 2, backgroundColor: "#6366F1" }}
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? "가입 중..." : "회원가입"}
          </Button>

          <Box sx={{ textAlign: "center", marginTop: 2 }}>
            <Typography variant="body2">
              이미 계정이 있으신가요?{" "}
              <Button color="primary" onClick={() => navigate("/login")} sx={{ textTransform: "none", padding: 0 }}>
                로그인
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Join