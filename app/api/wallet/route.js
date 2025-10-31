import { NextResponse } from 'next/server';
import { authMiddleware } from '../app/api/middleware/auth.js';
import prisma from '../prismaClient.js';

async function deductFromWalletHandler(req) {
  try {
    const body = await req.json();
    const { amount } = body;
    const userId = req.user.id;

    if (!amount || amount <= 0)
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });

    // Use a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found.');
      }

      if (user.wallet_balance < amount) {
        throw new Error('Insufficient wallet balance.');
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { wallet_balance: { decrement: amount } },
      });

      return updatedUser;
    });

    return NextResponse.json({ message: 'Wallet updated successfully.', wallet_balance: result.wallet_balance });
  } catch (err) {
    console.error('Wallet deduct error:', err.message);
    // Check for specific error messages to return appropriate status codes
    if (err.message === 'Insufficient wallet balance.') {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.message === 'User not found.') {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to deduct from wallet.' }, { status: 500 });
  }
}

export const POST = authMiddleware(deductFromWalletHandler);
