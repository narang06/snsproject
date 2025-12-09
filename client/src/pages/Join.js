"use client"

import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Box, TextField, Button, Typography, Paper, Alert, Avatar, InputAdornment } from "@mui/material"
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import { keyframes } from '@emotion/react';


const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
`;

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

    if (bio.length > 160) {
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

      const response = await fetch(`${process.env.REACT_APP_ADDR}/auth/join`, {
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          animation: `${fadeIn} 0.5s ease-out forwards`
        }}
      >
        <Paper
          sx={{
            width: "100%",
            padding: 5,
            borderRadius: "16px",
            boxShadow: 3,
            backgroundColor: "#FAFAFB"
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{ textAlign: "center", marginBottom: 2, fontWeight: 900, fontSize: "32px" }}
          >
            QUESTLY 가입
          </Typography>

          <Box
            sx={{
              width: "60%",
              height: 2,
              mx: "auto",
              mb: 3,
              background: "linear-gradient(to right, #E5E7EB, #D1D5DB, #E5E7EB)"
            }}
          />

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: "12px",
                fontSize: "0.875rem",
                boxShadow: 1,
                transition: "all 0.3s ease",
                transform: error ? "translateY(0)" : "translateY(-10px)",
                opacity: error ? 1 : 0
              }}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginY: 3 }}>
            <Typography variant="body1" sx={{ marginBottom: 1, fontWeight: 500 }}>프로필 이미지 (선택 사항)</Typography>
            <Avatar
              src={profileImagePreview}
              sx={{
                width: 100,
                height: 100,
                marginBottom: 2,
                bgcolor: "#E5E7EB",
                fontSize: 32,
                boxShadow: 2,
                transition: "all 0.3s ease",
                ":hover": { transform: "scale(1.05)" }
              }}
            >
              {!profileImagePreview && "U"}
            </Avatar>
            <Button
              variant="outlined"
              component="label"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "#4B5563",
                ":hover": { backgroundColor: "#F3F4F6" }
              }}
            >
              이미지 선택
              <input type="file" hidden accept="image/*" onChange={handleProfileImageChange} />
            </Button>
          </Box>

          <TextField
            fullWidth
            label="닉네임"
            inputRef={nicknameRef}
            margin="normal"
            variant="outlined"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "#F5F5F5",
                transition: "all 0.3s ease",
                "&.Mui-focused fieldset": {
                  borderColor: "#6366F1",
                  borderWidth: 2,
                  boxShadow: "0 0 5px rgba(99,102,241,0.5)"
                }
              }
            }}
          />
          <TextField
            fullWidth
            label="이메일"
            type="email"
            inputRef={emailRef}
            margin="normal"
            variant="outlined"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "#F5F5F5",
                transition: "all 0.3s ease",
                "&.Mui-focused fieldset": {
                  borderColor: "#6366F1",
                  borderWidth: 2,
                  boxShadow: "0 0 5px rgba(99,102,241,0.5)"
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: "#9CA3AF" }} />
                </InputAdornment>
              )
            }}
          />
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            inputRef={passwordRef}
            margin="normal"
            variant="outlined"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "#F5F5F5",
                transition: "all 0.3s ease",
                "&.Mui-focused fieldset": {
                  borderColor: "#6366F1",
                  borderWidth: 2,
                  boxShadow: "0 0 5px rgba(99,102,241,0.5)"
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ animation: error ? `${shake} 0.3s` : "none" }} />
                </InputAdornment>
              )
            }}
          />
          <TextField
            fullWidth
            label="비밀번호 확인"
            type="password"
            inputRef={passwordConfirmRef}
            margin="normal"
            variant="outlined"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "#F5F5F5",
                transition: "all 0.3s ease",
                "&.Mui-focused fieldset": {
                  borderColor: "#6366F1",
                  borderWidth: 2,
                  boxShadow: "0 0 5px rgba(99,102,241,0.5)"
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="자기소개 (선택 사항)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            multiline
            rows={3}
            maxLength={160} // 최대 길이 설정
            error={bio.length > 160} // 160자 초과 시 에러 상태
            helperText={
              bio.length > 0
                ? `${bio.length}/160 ${
                    bio.length > 160 ? ' (160자를 초과했습니다)' : ''
                  }`
                : '160자까지 입력 가능'
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EditIcon sx={{ color: "#9CA3AF" }} />
                </InputAdornment>
              )
            }}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: "12px",
              backgroundColor: "#6366F1",
              fontWeight: 600,
              boxShadow: 2,
              transition: "all 0.2s ease-in-out",
              ":hover": { backgroundColor: "#4F46E5" },
              ":active": { transform: "scale(0.97)" }
            }}
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