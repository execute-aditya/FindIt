'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import ItemCard from '@/components/items/ItemCard';
import { Item } from '@/types';
import styles from './page.module.css';

const CATEGORIES = ['All', 'ELECTRONICS', 'CLOTHING', 'ACCESSORIES', 'BOOKS', 'STATIONERY', 'KEYS', 'WALLET', 'ID_CARD', 'SPORTS', 'OTHER'];
const TYPES = [
  { value: 'ALL', label: '📋 All Items' },
  { value: 'LOST', label: '🔴 Lost' },
  { value: 'FOUND', label: '🟢 Found' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState('ALL');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (type !== 'ALL') params.set('type', type);
      if (category !== 'All') params.set('category', category);
      if (search) params.set('search', search);

      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [page, type, category, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  if (status === 'loading') return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-content ${styles.main}`}>
        {/* Header */}
        <div className={`glass ${styles.header}`}>
          <div className={styles.headerLeft}>
            <h1 className="headline-lg">Home Feed</h1>
            <p className="body-md text-on-variant">Browse items lost and found within the campus ecosystem.</p>
          </div>
          <Link href="/items/post" className="btn btn-primary">
            ➕ Post Item
          </Link>
        </div>

        <div className={styles.content}>
          {/* Search */}
          <form onSubmit={handleSearch} className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text" className={styles.searchInput}
              placeholder="Search items by name, description, or location…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>

          {/* Type Filter */}
          <div className={styles.typeFilter}>
            {TYPES.map((t) => (
              <button
                key={t.value}
                className={`${styles.typeChip} ${type === t.value ? styles.typeActive : ''}`}
                onClick={() => { setType(t.value); setPage(1); }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className={styles.catFilter}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`${styles.catChip} ${category === c ? styles.catActive : ''}`}
                onClick={() => { setCategory(c); setPage(1); }}
              >
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className={styles.resultsBar}>
            <span className="label-md text-on-variant">{total} items found</span>
            {search && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
                ✕ Clear search
              </button>
            )}
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="grid-items">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`skeleton ${styles.skeletonImg}`} />
                  <div className={styles.skeletonBody}>
                    <div className="skeleton" style={{ height: 16, width: '40%' }} />
                    <div className="skeleton" style={{ height: 20, width: '80%' }} />
                    <div className="skeleton" style={{ height: 14, width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📭</div>
              <h3 className="headline-sm">No items found</h3>
              <p className="body-md text-on-variant">
                {search ? `No results for "${search}"` : 'Be the first to post a lost or found item!'}
              </p>
              <Link href="/items/post" className="btn btn-primary">Post an Item</Link>
            </div>
          ) : (
            <div className="grid-items">
              {items.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          )}

          {/* Pagination */}
          {total > 12 && (
            <div className={styles.pagination}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >← Previous</button>
              <span className="label-md text-on-variant">
                Page {page} of {Math.ceil(total / 12)}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 12)}
              >Next →</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
