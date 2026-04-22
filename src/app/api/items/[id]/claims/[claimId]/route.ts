import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/items/[id]/claims/[claimId] — Approve or reject a claim
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; claimId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify item exists and user is the owner or admin
    const item = await prisma.item.findUnique({ where: { id: params.id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const isOwnerOrAdmin = item.userId === session.user.id || session.user.role === 'ADMIN';
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Only the item owner can review claims' }, { status: 403 });
    }

    // Verify claim exists
    const claim = await prisma.claim.findUnique({ where: { id: params.claimId } });
    if (!claim || claim.itemId !== params.id) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (claim.status !== 'PENDING') {
      return NextResponse.json({ error: 'This claim has already been reviewed' }, { status: 400 });
    }

    const body = await req.json();
    const { action, reviewNote } = body;

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    if (action === 'approve') {
      // Approve this claim
      await prisma.claim.update({
        where: { id: params.claimId },
        data: {
          status: 'APPROVED',
          reviewNote: reviewNote || null,
          reviewedAt: new Date(),
        },
      });

      // Reject all other pending claims on this item
      await prisma.claim.updateMany({
        where: {
          itemId: params.id,
          id: { not: params.claimId },
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          reviewNote: 'Another claim was approved',
          reviewedAt: new Date(),
        },
      });

      // Update item status to CLAIMED
      await prisma.item.update({
        where: { id: params.id },
        data: { status: 'CLAIMED' },
      });
    } else {
      // Reject this claim
      await prisma.claim.update({
        where: { id: params.claimId },
        data: {
          status: 'REJECTED',
          reviewNote: reviewNote || null,
          reviewedAt: new Date(),
        },
      });

      // Check if there are any remaining pending claims
      const pendingCount = await prisma.claim.count({
        where: {
          itemId: params.id,
          status: 'PENDING',
        },
      });

      // If no more pending claims, revert item to ACTIVE
      if (pendingCount === 0) {
        await prisma.item.update({
          where: { id: params.id },
          data: { status: 'ACTIVE' },
        });
      }
    }

    // Return updated claims list
    const claims = await prisma.claim.findMany({
      where: { itemId: params.id },
      include: {
        claimant: {
          select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get updated item
    const updatedItem = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
        },
      },
    });

    return NextResponse.json({ claims, item: updatedItem });
  } catch (error) {
    console.error('PATCH /api/items/[id]/claims/[claimId] error:', error);
    return NextResponse.json({ error: 'Failed to review claim' }, { status: 500 });
  }
}
