'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '../signin/page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div className={styles.formBox} style={{ maxWidth: '440px', width: '100%', padding: '40px 24px' }}>
        
        <div className={styles.formHeader} style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="headline-lg">Reset Password</h2>
          <p className="body-md text-on-variant" style={{ marginTop: '8px' }}>
            {submitted 
              ? 'Check your email for the reset link.' 
              : 'Enter your email address and we\'ll send you a link to reset your password.'}
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '24px' }}>📧</div>
            <Link href="/auth/signin" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Campus Email</label>
              <input
                id="email" type="email" className="input"
                placeholder="student@college.edu"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
              {loading ? '⏳ Sending Link…' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link href="/auth/signin" className={styles.switchLink}>← Back to Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
