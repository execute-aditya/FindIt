'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '../signin/page.module.css';

const COLLEGES = ['SCOE', 'BVCOE', 'RAIT', 'DJSCE'];
const DEPARTMENTS = ['Computer Engineering', 'Information Technology', 'Electronics & Telecomm.', 'Mechanical Engineering', 'Civil Engineering', 'Artificial Intelligence', 'Data Science', 'Other'];

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', department: '', phone: '', campus: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(form.name.trim())) { toast.error('Name should only contain alphabets'); return; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ['@comp.sce.edu.in', '@it.sce.edu.in', '@mech.sce.edu.in', '@civil.sce.edu.in', '@ds.sce.edu.in', '@aiml.sce.edu.in'];
    const emailStr = form.email.trim().toLowerCase();

    if (!emailRegex.test(emailStr)) { toast.error('Please enter a valid email address'); return; }
    
    if (!allowedDomains.some(domain => emailStr.endsWith(domain))) {
      toast.error('Please use your official college email address');
      return;
    }
    
    if (!form.phone.trim()) { toast.error('Phone number is required'); return; }
    if (!/^\d{10}$/.test(form.phone)) { toast.error('Please enter 10 digits valid mobile number (numeric)'); return; }
    
    if (!form.campus) { toast.error('Please select a college'); return; }
    
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email.trim().toLowerCase(),
          password: form.password,
          department: form.department,
          phone: form.phone,
          campus: form.campus,
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Registration failed'); return; }

      toast.success('Account created! Please sign in. 🎉');
      router.push('/auth/signin');
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
          <h1 className={`display-md ${styles.leftTitle}`}>Join your campus community today.</h1>
          <blockquote className={styles.quote}>
            "I lost my laptop on a Monday. FindIt had already matched it to a found post by Tuesday afternoon."
            <footer className={styles.quoteAuthor}>— Aditya Rathore, Engineering Student</footer>
          </blockquote>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>10K+</strong><span>Items Recovered</span></div>
            <div className={styles.stat}><strong>50+</strong><span>Campuses</span></div>
            <div className={styles.stat}><strong>Free</strong><span>Forever</span></div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className="headline-lg">Create Account</h2>
            <p className="body-md text-on-variant">Fill in your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className="input-group">
                <label className="input-label" htmlFor="name">Full Name</label>
                <input id="name" type="text" className="input" placeholder="Aditya Rathore" value={form.name} onChange={set('name')} required />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="phone">Phone *</label>
                <input id="phone" type="tel" className="input" placeholder="e.g. 9876543210" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))} required maxLength={10} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Campus Email</label>
              <input id="email" type="email" className="input" placeholder="student@college.edu" value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>

            <div className={styles.formGrid}>
              <div className="input-group">
                <label className="input-label" htmlFor="campus">College *</label>
                <select id="campus" className="input" value={form.campus} onChange={set('campus')} required>
                  <option value="">Select college</option>
                  {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="dept">Department</label>
                <select id="dept" className="input" value={form.department} onChange={set('department')}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div className={styles.pwWrap}>
                <input id="password" type={showPw ? 'text' : 'password'} className="input" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required autoComplete="new-password" />
                <button type="button" className={styles.pwToggle} onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirmPw">Confirm Password</label>
              <input id="confirmPw" type={showPw ? 'text' : 'password'} className="input" placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? '⏳ Creating account…' : '🎓 Create Account'}
            </button>
          </form>

          <p className={styles.switchText}>
            Already have an account?{' '}
            <Link href="/auth/signin" className={styles.switchLink}>Sign In</Link>
          </p>
          <p className={styles.copyright}>© 2024 FindIt Campus. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
