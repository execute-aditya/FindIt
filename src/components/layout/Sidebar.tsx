'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Home Feed' },
  { href: '/items/post', icon: '➕', label: 'Post Item' },
  { href: '/matches', icon: '🤖', label: 'AI Matches' },
  { href: '/profile', icon: '👤', label: 'My Profile' },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>F</div>
        <div>
          <div className={styles.logoText}>FindIt</div>
          <div className={styles.logoSub}>Campus</div>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="divider" style={{ margin: '12px 0' }} />

      {/* User info */}
      {session?.user && (
        <div className={styles.userSection}>
          <div className={styles.avatar}>
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name ?? ''} />
            ) : (
              <span>{(session.user.name ?? 'U')[0].toUpperCase()}</span>
            )}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{session.user.name}</div>
            <div className={styles.userEmail}>{session.user.email}</div>
          </div>
        </div>
      )}

      <button className={`nav-item ${styles.signOut}`} onClick={handleSignOut}>
        <span className="nav-icon">🚪</span>
        Sign Out
      </button>
    </aside>
  );
}
