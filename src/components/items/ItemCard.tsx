import React from 'react';
import { Item } from '@/types';
import Link from 'next/link';
import StatusBadge from './StatusBadge';
import styles from './ItemCard.module.css';

interface Props {
  item: Item;
  onClaim?: (id: string) => void;
}

export default function ItemCard({ item, onClaim }: Props) {
  const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const relativeCreated = (() => {
    const diff = Date.now() - new Date(item.createdAt).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  })();

  const categoryEmoji: Record<string, string> = {
    ELECTRONICS: '💻', CLOTHING: '👕', ACCESSORIES: '👜', BOOKS: '📚',
    STATIONERY: '✏️', KEYS: '🔑', WALLET: '👛', ID_CARD: '🪪',
    SPORTS: '⚽', OTHER: '📦',
  };

  return (
    <Link href={`/items/${item.id}`} className={`card ${styles.card}`}>
      {/* Image */}
      <div className={styles.imageWrap}>
        {item.images && item.images.length > 0 ? (
          <img src={item.images[0]} alt={item.title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.emoji}>{categoryEmoji[item.category] ?? '📦'}</span>
          </div>
        )}
        <div className={styles.badgeOverlay}>
          <StatusBadge type={item.type} status={item.status} />
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.category}>
          <span>{categoryEmoji[item.category]}</span>
          <span className="label-sm text-on-variant">{item.category.replace('_', ' ')}</span>
        </div>

        <h3 className={`${styles.title} title-md`}>{item.title}</h3>
        <p className={`${styles.desc} body-sm text-on-variant`}>
          {item.description.slice(0, 100)}{item.description.length > 100 ? '…' : ''}
        </p>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <span>📍</span>
            <span className="label-sm">{item.location}</span>
          </span>
          <span className={styles.metaItem}>
            <span>📅</span>
            <span className="label-sm">{formattedDate}</span>
          </span>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.poster}>
            <div className={styles.avatar}>
              {item.user.avatar ? (
                <img src={item.user.avatar} alt={item.user.name} />
              ) : (
                <span>{item.user.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="label-sm" style={{ color: 'var(--on-surface)' }}>{item.user.name}</div>
              <div className="label-sm text-on-variant">{relativeCreated}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
