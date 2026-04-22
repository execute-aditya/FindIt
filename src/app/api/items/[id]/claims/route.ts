import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/cloudinary';

// POST /api/items/[id]/claims — Submit a new claim
export async function POST(
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

    // Can't claim your own item
    if (item.userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot claim your own item' }, { status: 400 });
    }

    // Item must be ACTIVE or PENDING_CLAIM (allow multiple claims)
    if (item.status !== 'ACTIVE' && item.status !== 'PENDING_CLAIM') {
      return NextResponse.json({ error: 'This item is no longer available for claims' }, { status: 400 });
    }

    // Check if user already has a pending claim on this item
    const existingClaim = await prisma.claim.findFirst({
      where: {
        itemId: params.id,
        claimantId: session.user.id,
        status: 'PENDING',
      },
    });
    if (existingClaim) {
      return NextResponse.json({ error: 'You already have a pending claim on this item' }, { status: 400 });
    }

    const body = await req.json();
    const { description, proofImages } = body;

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a detailed description (at least 10 characters) of why this item is yours' },
        { status: 400 }
      );
    }

    // Upload proof images to Cloudinary if provided
    let imageUrls: string[] = [];
    if (proofImages && proofImages.length > 0) {
      imageUrls = await Promise.all(
        proofImages.slice(0, 3).map((img: string) => uploadImage(img))
      );
    }

    // Create the claim
    const claim = await prisma.claim.create({
      data: {
        itemId: params.id,
        claimantId: session.user.id,
        description: description.trim(),
        proofImages: imageUrls,
      },
      include: {
        claimant: {
          select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
        },
      },
    });

    // Update item status to PENDING_CLAIM
    await prisma.item.update({
      where: { id: params.id },
      data: { status: 'PENDING_CLAIM' },
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (error) {
    console.error('POST /api/items/[id]/claims error:', error);
    return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 });
  }
}

// GET /api/items/[id]/claims — List all claims for an item
export async function GET(
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

    // Only the item owner, admin, or a claimant can see claims
    const isOwnerOrAdmin = item.userId === session.user.id || session.user.role === 'ADMIN';

    const claims = await prisma.claim.findMany({
      where: {
        itemId: params.id,
        // Non-owners can only see their own claims
        ...(!isOwnerOrAdmin && { claimantId: session.user.id }),
      },
      include: {
        claimant: {
          select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ claims, isOwner: item.userId === session.user.id });
  } catch (error) {
    console.error('GET /api/items/[id]/claims error:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}
