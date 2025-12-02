import { useRef, useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Container, Box, TextField, Button, Typography, Paper, Alert, InputAdornment } from "@mui/material"
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
`;

const Login = ({ onLogin }) => { 
  const emailRef = useRef()
  const passwordRef = useRef()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [successMessage, setSuccessMessage] = useState({ message: "", type: "info" })

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const message = searchParams.get("message")
    const type = searchParams.get("type") || "info"

    if (message) {
      setSuccessMessage({ message, type })
      const timer = setTimeout(() => {
        setSuccessMessage({ message: "", type: "info" })
        navigate("/login", { replace: true })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [location.search, navigate])

  const handleLogin = async () => {
    setError("")
    const email = emailRef.current.value
    const password = passwordRef.current.value

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("http://localhost:3010/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "로그인 실패")
        return
      }

      onLogin(data)
      navigate('/') 

    } catch (err) {
      setError("서버 연결 오류")
    } finally {
      setLoading(false)
    }
  }

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
          <Typography variant="h3" component="h1" sx={{ textAlign: "center", marginBottom: 2, fontWeight: "900", fontSize: "32px" }}>
            QUESTLY
          </Typography>
          
          <Box sx={{ 
            width: '60%', 
            height: 2, 
            mx: 'auto', 
            mb: 3, 
            background: 'linear-gradient(to right, #E5E7EB, #D1D5DB, #E5E7EB)' 
          }} />

          
          {successMessage.message && (
            <Alert 
              severity={successMessage.type} 
              sx={{ 
                mb: 3, 
                borderRadius: "12px", 
                fontSize: "0.875rem", 
                boxShadow: 1,
                transition: "all 0.3s ease",
                transform: successMessage.message ? "translateY(0)" : "translateY(-10px)",
                opacity: successMessage.message ? 1 : 0
              }}
            >
              {successMessage.message}
            </Alert>
          )}

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
          
          <TextField
            fullWidth
            label="이메일"
            type="email"
            inputRef={emailRef}
            margin="dense"
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
              ),
            }}
          />

          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            inputRef={passwordRef}
            margin="dense"
            variant="outlined"
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "#F5F5F5",
                "&.Mui-focused fieldset": { borderColor: "#6366F1", borderWidth: 2 }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ animation: error ? `${shake} 0.3s` : "none" }} />
                </InputAdornment>
              ),
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
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </Button>

          <Box sx={{ textAlign: "center", marginTop: 2 }}>
            <Typography variant="body2">
              계정이 없으신가요.?{" "}
              <Button 
                color="primary" 
                onClick={() => navigate("/join")} 
                sx={{ 
                  textTransform: "none", 
                  padding: 0, 
                  fontWeight: 500, 
                  color: "#4B5563",     
                  ":hover": { textDecoration: "underline" } 
                }}
              >
                회원가입
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login