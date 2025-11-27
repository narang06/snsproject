import { useRef, useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Container, Box, TextField, Button, Typography, Paper, Alert } from "@mui/material"

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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Paper sx={{ width: "100%", padding: 4 }}>
          <Typography variant="h4" component="h1" sx={{ textAlign: "center", marginBottom: 3, fontWeight: "bold" }}>
            QUESTLY
          </Typography>

          {successMessage.message && (
            <Alert severity={successMessage.type} sx={{ marginBottom: 2 }}>
              {successMessage.message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <TextField fullWidth label="이메일" type="email" inputRef={emailRef} margin="normal" variant="outlined" />
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            inputRef={passwordRef}
            margin="normal"
            variant="outlined"
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ marginTop: 2, backgroundColor: "#6366F1" }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </Button>

          <Box sx={{ textAlign: "center", marginTop: 2 }}>
            <Typography variant="body2">
              계정이 없으신가요.?{" "}
              <Button color="primary" onClick={() => navigate("/join")} sx={{ textTransform: "none", padding: 0 }}>
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