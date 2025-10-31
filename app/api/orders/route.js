import { NextResponse } from 'next/server';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../prismaClient.js';

async function createOrderHandler(req) {
  try {
    const body = await req.json();
    const userId = req.user.id;
    const { items, subtotal, service_fee, total_amount, payment_method } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in the order.' }, { status: 400 });
    }

    // Fetch user wallet
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (payment_method === 'wallet') {
      if (user.wallet_balance < total_amount) {
        return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 400 });
      }

      // Deduct wallet balance
      await prisma.user.update({
        where: { id: userId },
        data: { wallet_balance: { decrement: total_amount } },
      });
    }

    // Create order with order items in a transaction
    const order = await prisma.order.create({
      data: {
        userId: userId, // Prisma schema usually uses camelCase for relation fields
        subtotal,
        service_fee,
        total_amount,
        payment_method,
        status: 'Pending',
        items: {
          create: items.map((item) => ({
            medicineId: item.medicine_id, // Prisma schema usually uses camelCase
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error('Order creation failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = authMiddleware(createOrderHandler);
