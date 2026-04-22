'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import ItemCard from '@/components/items/ItemCard';
import { Item } from '@/types';
import styles from './page.module.css';

type Tab = 'ALL' | 'LOST' | 'FOUND' | 'RESOLVED';

const COLLEGES = ['SCOE', 'BVCOE', 'RAIT', 'DJSCE'];
const DEPARTMENTS = [
  'Computer Engineering', 'Information Technology', 'Electronics & Telecom',
  'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering',
  'Chemical Engineering', 'Data Science', 'AI & ML', 'Other',
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<Tab>('ALL');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', department: '', phone: '', campus: '' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/profile/items').then((r) => r.json()),
    ])
      .then(([profileData, itemsData]) => {
        setProfile(profileData.user);
        setItems(itemsData.items ?? []);
        setForm({
          name: profileData.user?.name ?? '',
          department: profileData.user?.department ?? '',
          phone: profileData.user?.phone ?? '',
          campus: profileData.user?.campus ?? '',
        });
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load profile'); setLoading(false); });
  }, [status]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setEditing(false);
        toast.success('Profile updated! ✨');
      } else toast.error(data.error ?? 'Failed to update');
    } finally { setSaving(false); }
  };

  const filteredItems = items.filter((item) => {
    if (tab === 'ALL') return true;
    if (tab === 'RESOLVED') return item.status === 'CLAIMED' || item.status === 'RESOLVED';
    return item.type === tab && (item.status === 'ACTIVE' || item.status === 'PENDING_CLAIM');
  });

  // Stats
  const lostCount = items.filter(i => i.type === 'LOST').length;
  const foundCount = items.filter(i => i.type === 'FOUND').length;
  const resolvedCount = items.filter(i => i.status === 'CLAIMED' || i.status === 'RESOLVED').length;
  const activeCount = items.filter(i => i.status === 'ACTIVE' || i.status === 'PENDING_CLAIM').length;
  const recoveryRate = lostCount > 0 ? Math.round((resolvedCount / items.length) * 100) : 0;

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  const daysSinceJoin = profile?.createdAt
    ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Achievement badges
  const badges = [
    ...(foundCount >= 1 ? [{ icon: '🦸', label: 'Good Samaritan', desc: 'Posted a found item' }] : []),
    ...(resolvedCount >= 1 ? [{ icon: '🏆', label: 'Resolver', desc: 'Resolved an item' }] : []),
    ...(items.length >= 5 ? [{ icon: '⭐', label: 'Active Member', desc: '5+ posts' }] : []),
    ...(foundCount >= 3 ? [{ icon: '🎖️', label: 'Campus Hero', desc: '3+ found items reported' }] : []),
    ...(daysSinceJoin >= 30 ? [{ icon: '📆', label: 'Veteran', desc: '30+ days on platform' }] : []),
  ];

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-content ${styles.main}`}>
        <div className={styles.loadingState}><div className={styles.spinner} /><p className="body-md text-on-variant">Loading profile…</p></div>
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-content ${styles.main}`}>
        {/* Hero banner */}
        <div className={styles.heroBanner}>
          <div className={styles.heroPattern} />
          <div className={styles.heroContent}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarLarge}>
                {profile?.avatar ? <img src={profile.avatar} alt="" /> : <span>{(profile?.name ?? 'U')[0].toUpperCase()}</span>}
              </div>
              <div className={styles.onlineIndicator} />
            </div>
            <div className={styles.heroInfo}>
              <h1 className="display-sm">{profile?.name}</h1>
              <p className="body-md" style={{ opacity: 0.85 }}>{profile?.email}</p>
              <div className={styles.heroChips}>
                {profile?.department && <span className={styles.heroChip}>🎓 {profile.department}</span>}
                {profile?.campus && <span className={styles.heroChip}>🏫 {profile.campus}</span>}
                {memberSince && <span className={styles.heroChip}>📅 Since {memberSince}</span>}
              </div>
            </div>
            <button className={styles.editBtn} onClick={() => setEditing(!editing)}>
              {editing ? '✕ Close Details' : '👁️ View Profile Details'}
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {/* Edit form */}
          {editing && (
            <div className={styles.editCard}>
              <h3 className="headline-sm">👁️ Profile Details</h3>
              <p className="body-md text-on-variant" style={{ marginBottom: '16px' }}>
                Your identity details are locked to ensure campus safety and cannot be changed after registration.
              </p>
              <div className={styles.editGrid}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input className="input" value={form.name} disabled />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input className="input" type="tel" value={form.phone} disabled />
                </div>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <select className="input" value={form.department} disabled>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">College</label>
                  <select className="input" value={form.campus} disabled>
                    <option value="">Select college</option>
                    {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#ffebee' }}>🔴</div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{lostCount}</div>
                <div className={styles.statLabel}>Lost Items</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#e8f5e9' }}>🟢</div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{foundCount}</div>
                <div className={styles.statLabel}>Found Items</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#e3f2fd' }}>📊</div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{activeCount}</div>
                <div className={styles.statLabel}>Active</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#f3e5f5' }}>✅</div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{resolvedCount}</div>
                <div className={styles.statLabel}>Resolved</div>
              </div>
            </div>
          </div>

          {/* Achievement badges */}
          {badges.length > 0 && (
            <div className={styles.badgesSection}>
              <h3 className="title-md">🏅 Achievements</h3>
              <div className={styles.badgesGrid}>
                {badges.map((badge, i) => (
                  <div key={i} className={styles.badge}>
                    <span className={styles.badgeIcon}>{badge.icon}</span>
                    <div>
                      <div className="label-md">{badge.label}</div>
                      <div className="label-sm text-on-variant">{badge.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <Link href="/items/post" className={styles.quickAction}>
              <span className={styles.qaIcon}>➕</span>
              <span className="label-md">Post Item</span>
            </Link>
            <Link href="/matches" className={styles.quickAction}>
              <span className={styles.qaIcon}>🧠</span>
              <span className="label-md">AI Search</span>
            </Link>
            <Link href="/dashboard" className={styles.quickAction}>
              <span className={styles.qaIcon}>🏠</span>
              <span className="label-md">Home Feed</span>
            </Link>
          </div>

          {/* Tabs & Items */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h3 className="headline-sm">📋 Your Posts</h3>
              <span className="body-sm text-on-variant">{items.length} total</span>
            </div>
            <div className={styles.tabs}>
              {([
                { key: 'ALL', icon: '📊', label: 'All' },
                { key: 'LOST', icon: '🔴', label: 'Lost' },
                { key: 'FOUND', icon: '🟢', label: 'Found' },
                { key: 'RESOLVED', icon: '✅', label: 'Resolved' },
              ] as { key: Tab; icon: string; label: string }[]).map((t) => (
                <button key={t.key} className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
                  {t.icon} {t.label}
                  <span className={styles.tabCount}>{
                    t.key === 'ALL' ? items.length
                    : t.key === 'RESOLVED' ? resolvedCount
                    : items.filter(i => i.type === t.key && (i.status === 'ACTIVE' || i.status === 'PENDING_CLAIM')).length
                  }</span>
                </button>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>
                  {tab === 'LOST' ? '😢' : tab === 'FOUND' ? '🔍' : tab === 'RESOLVED' ? '🎉' : '📭'}
                </span>
                <h3 className="title-md">
                  {tab === 'ALL' ? 'No posts yet' : `No ${tab.toLowerCase()} items`}
                </h3>
                <p className="body-sm text-on-variant">
                  {tab === 'ALL' || tab === 'LOST'
                    ? 'Lost something? Report it to get help from the community.'
                    : tab === 'FOUND'
                      ? 'Found an item on campus? Help reunite it with its owner.'
                      : 'Resolved items will appear here.'}
                </p>
                {(tab === 'ALL' || tab === 'LOST' || tab === 'FOUND') && (
                  <Link href="/items/post" className="btn btn-primary btn-sm">➕ Post an Item</Link>
                )}
              </div>
            ) : (
              <div className="grid-items">
                {filteredItems.map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
