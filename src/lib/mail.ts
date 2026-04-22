import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const confirmLink = `${baseUrl}/auth/verify?token=${token}`;

  if (!process.env.SMTP_HOST) {
    console.warn('\n======================================================');
    console.warn('⚠️ SMTP_HOST is not configured in environment variables.');
    console.warn('⚠️ Please visit the following link to verify your email:');
    console.warn(`🔗 ${confirmLink}`);
    console.warn('======================================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@findit.local',
    to: email,
    subject: 'Confirm your email address - FindIT Campus',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to FindIT Campus!</h2>
        <p>You're almost there. Please confirm your email address to activate your account and start finding or posting items.</p>
        <div style="margin: 30px 0;">
          <a href="${confirmLink}" style="padding: 12px 24px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${confirmLink}</p>
        <p style="margin-top: 40px; font-size: 12px; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

  if (!process.env.SMTP_HOST) {
    console.warn('\n======================================================');
    console.warn('⚠️ SMTP_HOST is not configured in environment variables.');
    console.warn('⚠️ Please visit the following link to reset your password:');
    console.warn(`🔗 ${resetLink}`);
    console.warn('======================================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@findit.local',
    to: email,
    subject: 'Reset your password - FindIT Campus',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your FindIT Campus password. Click the button below to choose a new password.</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="padding: 12px 24px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${resetLink}</p>
        <p style="margin-top: 40px; font-size: 12px; color: #999;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
}
