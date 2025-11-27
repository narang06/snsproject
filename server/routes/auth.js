import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import db from "../db.js"
import multer from "multer"
import path from "path" 
import fs from "fs"     

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles"; 
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 회원가입
router.post("/join", upload.single('profileImage'), async (req, res) => {
  try {
    const { nickname, email, password, bio } = req.body;
    const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : null;

    if (!nickname || !email || !password) {
      return res.status(400).json({ message: "모든 필드를 입력해주세요" });
    }

    const [existingUserByEmail] = await db.query("SELECT id FROM users WHERE email = ?", [email]);

    if (existingUserByEmail.length > 0) {
      return res.status(400).json({ message: "이미 가입된 이메일입니다" });
    }

    // 닉네임+고유번호 조합
    let nicknameTag;
    let isUnique = false;
    while (!isUnique) {
      nicknameTag = Math.floor(1000 + Math.random() * 9000).toString();
      const [existingUserByNickname] = await db.query(
        "SELECT id FROM users WHERE nickname = ? AND nickname_tag = ?",
        [nickname, nicknameTag]
      );
      if (existingUserByNickname.length === 0) {
        isUnique = true;
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 8);

    await db.query(
      "INSERT INTO users (nickname, nickname_tag, email, password, bio, profile_image_url) VALUES (?, ?, ?, ?, ?, ?)",
      [nickname, nicknameTag, email, hashedPassword, bio || null, profileImage]
    );

    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요" })
    }

    // 사용자 조회
    const [users] = await db.query("SELECT id, email, password FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 잘못되었습니다" })
    }

    const user = users[0]

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 잘못되었습니다" })
    }

    // JWT 토큰 생성
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" })

    res.status(200).json({
      message: "로그인 성공",
      token,
      userId: user.id,
    })
  } catch (err) {
    console.error("로그인 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

export default router
