import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hUEq6Ne9nNSHLTpiIk/QyhRPkMHGHiGL7z7XLDt0GcE=';

// ✅ This is the middleware function you want to export
export function authMiddleware(handler) {
  return async (req, ...args) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach the user data to the request
      req.user = decoded;

      // Continue to the actual route handler
      return handler(req, ...args);
    } catch (err) {
      console.error('Auth middleware error:', err.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
}
