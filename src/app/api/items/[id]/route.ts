import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
        },
        claims: {
          include: {
            claimant: {
              select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Filter claims: owners/admins see all, others see only their own
    const isOwnerOrAdmin = session?.user?.id === item.userId || session?.user?.role === 'ADMIN';
    const filteredItem = {
      ...item,
      claims: isOwnerOrAdmin
        ? item.claims
        : item.claims.filter((c: any) => c.claimantId === session?.user?.id),
    };

    return NextResponse.json({ item: filteredItem });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, title, description, brand, color, serialNumber, contactInfo } = body;

    const item = await prisma.item.findUnique({ where: { id: params.id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const isOwnerOrAdmin = item.userId === session.user.id || session.user.role === 'ADMIN';

    // Only the owner or admin can update items now
    // Claims are handled through the /claims endpoint
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden — use the claims endpoint to claim an item' }, { status: 403 });
    }

    // Owner can mark as RESOLVED (skip straight from any state)
    const allowedStatusUpdates = ['RESOLVED', 'ACTIVE'];
    if (status && !allowedStatusUpdates.includes(status)) {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }

    const updated = await prisma.item.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description && { description }),
        ...(brand !== undefined && { brand }),
        ...(color !== undefined && { color }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(contactInfo !== undefined && { contactInfo }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
        },
        claims: {
          include: {
            claimant: {
              select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.item.findUnique({ where: { id: params.id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const createdAt = new Date(item.createdAt);
    if (now.getTime() - createdAt.getTime() < SEVEN_DAYS_MS && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'This post can be deleted after 7 days from creation' }, { status: 403 });
    }

    await prisma.item.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
