import jwt from "jsonwebtoken";
import db from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "인증 토큰이 없습니다" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const [users] = await db.query("SELECT id FROM users WHERE id = ?", [decoded.userId]);
    if (users.length === 0) {
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다. (삭제되었거나 존재하지 않음)" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    // 토큰 만료, 잘못된 형식 등의 오류 처리
    res.status(401).json({ message: "유효하지 않은 토큰입니다" });
  }
};

export default authMiddleware;