// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../prismaClient.js";
import { authMiddleware } from "../../../middleware/auth.js";

interface AuthenticatedNextRequest extends NextRequest {
  user: { id: number; email: string; role: string }; // This will be added by authMiddleware
}

// -------------------------
// GET single order by ID
// -------------------------
async function getOrderHandler(req: AuthenticatedNextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    // Ensure the user is an admin (req.user is added by authMiddleware, but TypeScript doesn't know it here)
    if (req.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admins only." }, { status: 403 });
    }

    const order = await prisma.orders.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        users: {
          select: { fullname: true },
        },
        order_items: {
          include: {
            medicines: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Format data for frontend
    const formatted = {
      id: order.id.toString(),
      user_fullname: order.users?.fullname ?? "Unknown",
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.created_at,
      items: order.order_items.map((item: any) => ({
        id: item.id,
        medicine_name: item.medicines?.name ?? "Unknown Medicine",
        quantity: item.quantity,
        price: item.price.toString(),
      })) ?? [],
    };

    return NextResponse.json(formatted);
  } catch (err) {
    console.error(`[ORDER_FETCH_ERROR: ${id}]`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ------------------------- 
// PUT update order status
// -------------------------
async function updateOrderHandler(req: AuthenticatedNextRequest, { params }: { params: { id: string } }) {
  const { id } = params; 

  try {
    // Ensure the user is an admin
    if (req.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admins only." }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !["Pending", "Packed", "Delivered", "Cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid or missing status value" },
        { status: 400 }
      );
    }

    await prisma.orders.update({
      where: { id: parseInt(id, 10) },
      data: { status },
    });

    return NextResponse.json({ message: "Order status updated" });
  } catch (err) {
    console.error(`[ORDER_UPDATE_ERROR: ${id}]`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = authMiddleware(getOrderHandler);
export const PUT = authMiddleware(updateOrderHandler);

export const runtime = 'nodejs'; // Force Node.js runtime for JWT compatibility
