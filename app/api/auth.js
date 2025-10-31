import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export function authMiddleware(handler) {
  return async (req, ...args) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided or invalid format' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Attach user information to the request object for the handler to use
      req.user = { id: decoded.userId, fullname: decoded.fullname, role: decoded.role };
      return handler(req, ...args);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
  };
}