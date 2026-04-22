'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../signin/page.module.css';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    if (!token) {
      setStatus('error');
      setErrorMessage('Missing verification token.');
      return;
    }

    const verifyToken = async () => {
      hasVerified.current = true;
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Something went wrong during verification.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div className={styles.formBox} style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '40px 24px' }}>
        
        {status === 'loading' && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⏳</div>
            <h2 className="headline-lg">Verifying email...</h2>
            <p className="body-md text-on-variant" style={{ marginTop: '16px' }}>Please wait while we confirm your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 className="headline-lg">Email Verified!</h2>
            <p className="body-md text-on-variant" style={{ marginTop: '16px', marginBottom: '32px' }}>
              Your email has been successfully verified. You can now sign in to your FindIT account.
            </p>
            <Link href="/auth/signin" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h2 className="headline-lg" style={{ color: 'var(--error)' }}>Verification Failed</h2>
            <p className="body-md text-on-variant" style={{ marginTop: '16px', marginBottom: '32px' }}>{errorMessage}</p>
            <Link href="/auth/signin" className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
