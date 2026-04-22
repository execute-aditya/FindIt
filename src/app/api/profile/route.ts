import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/cloudinary';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, avatar: true,
        department: true, phone: true, campus: true, role: true, createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, department, phone, campus, avatar } = body;

    let avatarUrl: string | undefined;
    if (avatar && avatar.startsWith('data:')) {
      avatarUrl = await uploadImage(avatar);
    } else if (avatar) {
      avatarUrl = avatar;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(department !== undefined && { department }),
        ...(phone !== undefined && { phone }),
        ...(campus && { campus }),
        ...(avatarUrl && { avatar: avatarUrl }),
      },
      select: {
        id: true, name: true, email: true, avatar: true,
        department: true, phone: true, campus: true, createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
