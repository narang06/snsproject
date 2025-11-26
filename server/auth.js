
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "인증 토큰이 없습니다" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    // 토큰 만료, 잘못된 형식 등의 오류 처리
    res.status(401).json({ message: "유효하지 않은 토큰입니다" });
  }
};

export default authMiddleware;