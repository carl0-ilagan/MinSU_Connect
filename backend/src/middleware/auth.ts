import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      sessionId?: string;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get or create session
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    let session = await prisma.session.findFirst({
      where: {
        userId: user.id,
        userAgent,
        ip
      }
    });

    if (!session) {
      session = await prisma.session.create({
        data: {
          userId: user.id,
          userAgent,
          ip
        }
      });
    } else {
      // Update last active timestamp
      session = await prisma.session.update({
        where: { id: session.id },
        data: { lastActive: new Date() }
      });
    }

    req.user = user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}; 