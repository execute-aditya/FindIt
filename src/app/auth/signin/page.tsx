'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.css';
import { useEffect } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ['@comp.sce.edu.in', '@it.sce.edu.in', '@mech.sce.edu.in', '@civil.sce.edu.in', '@ds.sce.edu.in', '@aiml.sce.edu.in'];
    const emailStr = email.trim().toLowerCase();

    if (!emailRegex.test(emailStr)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!allowedDomains.some(domain => emailStr.endsWith(domain))) {
      toast.error('Please use your official college email address');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
      } else {
        toast.success('Welcome back! 🎉');
        router.push('/dashboard');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.backLink}>← Back to Home</Link>
          <div className={styles.leftLogo}>
            <div className={styles.logoMark}>F</div>
            <span className={styles.logoText}>FindIt</span>
          </div>
          <h1 className={`display-md ${styles.leftTitle}`}>Lost items found through intelligence &amp; trust.</h1>
          <blockquote className={styles.quote}>
            "FindIt has completely transformed our campus lost-and-found. It's not just an app — it's a curated safety net for our student body."
            <footer className={styles.quoteAuthor}>— Dr. Priya Sharma, Dean of Students</footer>
          </blockquote>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>94%</strong><span>Recovery Rate</span></div>
            <div className={styles.stat}><strong>2.4h</strong><span>Avg. Match Time</span></div>
            <div className={styles.stat}><strong>10K+</strong><span>Items Recovered</span></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className="headline-lg">Welcome Back!</h2>
            <p className="body-md text-on-variant">Reconnect with your campus community.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Campus Email</label>
              <input
                id="email" type="email" className="input"
                placeholder="student@college.edu"
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" required
              />
            </div>

            <div className="input-group">
              <div className={styles.pwLabel}>
                <label className="input-label" htmlFor="password">Password</label>
                <Link href="/auth/forgot-password" className={styles.forgotLink}>Forgot Password?</Link>
              </div>
              <div className={styles.pwWrap}>
                <input
                  id="password" type={showPw ? 'text' : 'password'} className="input"
                  placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password" required
                />
                <button type="button" className={styles.pwToggle} onClick={() => setShowPw(!showPw)}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? '⏳ Signing in…' : '🔐 Sign In'}
            </button>
          </form>

          <p className={styles.switchText}>
            Don't have an account?{' '}
            <Link href="/auth/signup" className={styles.switchLink}>Create an Account</Link>
          </p>

          <p className={styles.legal}>
            By signing in, you agree to our{' '}
            <a href="#">Privacy Policy</a> and <a href="#">Terms of Service</a>.
          </p>
          <p className={styles.copyright}>© 2024 FindIt Campus. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
