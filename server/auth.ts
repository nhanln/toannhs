import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { User, UserRole } from '../src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mathexam-secret-key-2025';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      className: user.className
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Chưa cung cấp mã xác thực (Token).' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị xóa.' });
    }
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      className: user.className,
      createdAt: user.createdAt
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Phiên đăng nhập hết hạn hoặc mã xác thực không hợp lệ.' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
  };
}
