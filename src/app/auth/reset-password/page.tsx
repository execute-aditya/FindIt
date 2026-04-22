'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '../signin/page.module.css';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Missing reset token');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password');
        return;
      }

      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '16px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>❌</div>
        <h2 className="headline-md" style={{ color: 'var(--error)' }}>Invalid Link</h2>
        <p className="body-md text-on-variant" style={{ marginTop: '16px', marginBottom: '32px' }}>
          This password reset link is invalid or missing the token. Please request a new one.
        </p>
        <Link href="/auth/forgot-password" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Request New Link</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '16px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
        <h2 className="headline-md">Password Changed</h2>
        <p className="body-md text-on-variant" style={{ marginTop: '16px', marginBottom: '32px' }}>
          Your password has been successfully updated. Redirecting you to sign in...
        </p>
        <Link href="/auth/signin" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Sign In Now</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className="input-group">
        <label className="input-label" htmlFor="password">New Password</label>
        <div className={styles.pwWrap}>
          <input
            id="password" type={showPw ? 'text' : 'password'} className="input"
            placeholder="Min. 8 characters"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="button" className={styles.pwToggle} onClick={() => setShowPw(!showPw)}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label" htmlFor="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword" type={showPw ? 'text' : 'password'} className="input"
          placeholder="Re-enter password"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
        {loading ? '⏳ Resetting Password…' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div className={styles.formBox} style={{ maxWidth: '440px', width: '100%', padding: '40px 24px' }}>
        <div className={styles.formHeader} style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="headline-lg">Create New Password</h2>
          <p className="body-md text-on-variant" style={{ marginTop: '8px' }}>
            Enter your new password below.
          </p>
        </div>
        <Suspense fallback={<div style={{ textAlign: 'center' }}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
