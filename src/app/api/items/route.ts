import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/cloudinary';
import { z } from 'zod';

const itemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum([
    'ELECTRONICS', 'CLOTHING', 'ACCESSORIES', 'BOOKS', 'STATIONERY',
    'KEYS', 'WALLET', 'ID_CARD', 'SPORTS', 'OTHER',
  ]),
  type: z.enum(['LOST', 'FOUND']),
  location: z.string().min(2, 'Location is required'),
  campus: z.string().optional(),
  date: z.string(),
  brand: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  contactInfo: z.string().optional().nullable(),
  images: z.array(z.string()).optional(), // base64 or URLs
}).passthrough(); // Zod v4 is strict by default — passthrough allows extra keys

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '12');
    const skip = (page - 1) * limit;

    // Always scope to the user's own college — show active and pending-claim items
    const where: any = {
      status: { in: ['ACTIVE', 'PENDING_CLAIM'] },
      campus: session.user.campus,
    };
    if (type && type !== 'ALL') where.type = type;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
        { brand: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = itemSchema.parse(body);

    // Upload images to Cloudinary
    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      imageUrls = await Promise.all(
        data.images.map((img) => uploadImage(img))
      );
    }

    // Get the user's college from DB to ensure it's always correctly set
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { campus: true },
    });

    const item = await prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        location: data.location,
        campus: userRecord?.campus ?? session.user.campus ?? '',
        date: new Date(data.date),
        images: imageUrls,
        tags: data.tags ?? [],
        brand: data.brand,
        color: data.color,
        serialNumber: data.serialNumber,
        contactInfo: data.contactInfo,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, department: true, phone: true },
        },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Validation error' }, { status: 400 });
    }
    console.error('POST /api/items error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
