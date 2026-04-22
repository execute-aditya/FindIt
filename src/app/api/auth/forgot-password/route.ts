import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const result = z.string().email().safeParse(email);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always immediately return a generic success message to prevent user enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account with that email exists, we sent a password reset link.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({ message: 'If an account with that email exists, we sent a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
