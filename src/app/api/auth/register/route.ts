import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/mail';

const allowedDomains = [
  '@comp.sce.edu.in', '@it.sce.edu.in', '@mech.sce.edu.in',
  '@civil.sce.edu.in', '@ds.sce.edu.in', '@aiml.sce.edu.in'
];

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').regex(/^[a-zA-Z\s]+$/, 'Name should only contain alphabets'),
  email: z.string().email('Invalid email address').refine(email => {
    return allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
  }, { message: 'Please use your official college email address' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, 'Please enter 10 digits valid mobile number (numeric)'),
  campus: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        department: data.department,
        phone: data.phone,
        campus: data.campus ?? 'Main Campus',
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await sendVerificationEmail(user.email, token);

    return NextResponse.json({ 
      user, 
      message: 'Account created successfully! Please check your email to verify your account before signing in.' 
    }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes('phone')) {
      return NextResponse.json(
        { error: 'This phone number is already registered' },
        { status: 409 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Validation error' },
        { status: 400 }
      );
    }
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
