'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import StatusBadge from '@/components/items/StatusBadge';
import { Item, Claim } from '@/types';
import styles from './page.module.css';

const CATEGORY_EMOJI: Record<string, string> = {
  ELECTRONICS: '💻', CLOTHING: '👕', ACCESSORIES: '👜', BOOKS: '📚',
  STATIONERY: '✏️', KEYS: '🔑', WALLET: '👛', ID_CARD: '🪪', SPORTS: '⚽', OTHER: '📦',
};

const STATUS_STEPS = [
  { key: 'ACTIVE', label: 'Active', icon: '📢' },
  { key: 'PENDING_CLAIM', label: 'Pending', icon: '⏳' },
  { key: 'CLAIMED', label: 'Claimed', icon: '✅' },
  { key: 'RESOLVED', label: 'Resolved', icon: '🎉' },
];

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

// ─── Claim Modal ──────────────────────────────────────────────
function ClaimModal({ item, onClose, onSubmitted }: { item: Item; onClose: () => void; onSubmitted: (claim: Claim) => void }) {
  const [description, setDescription] = useState('');
  const [proofFiles, setProofFiles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const readers = Array.from(files).slice(0, 3).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(setProofFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.error('Please provide at least 10 characters describing why this item is yours');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/${item.id}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, proofImages: proofFiles }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Claim submitted! The owner will review it. 📬');
        onSubmitted(data.claim);
      } else {
        toast.error(data.error ?? 'Failed to submit claim');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const isLostItem = item.type === 'LOST';

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${styles.claimModal}`}>
        <div className={styles.claimModalHeader}>
          <div>
            <h2 className="headline-md">{isLostItem ? '📍 Report a Find' : '🙋 Claim This Item'}</h2>
            <p className="body-sm text-on-variant">
              {isLostItem
                ? 'Tell the owner where and how you found their item'
                : 'Prove this found item belongs to you'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.claimForm}>
          {/* Item preview */}
          <div className={styles.claimItemPreview}>
            <div className={styles.claimItemThumb}>
              {item.images && item.images.length > 0
                ? <img src={item.images[0]} alt="" />
                : <span>{CATEGORY_EMOJI[item.category]}</span>}
            </div>
            <div>
              <div className="title-sm">{item.title}</div>
              <div className="label-sm text-on-variant">{item.location} • {item.campus}</div>
            </div>
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label">
              {isLostItem ? 'Where & how did you find it? *' : 'Why is this yours? *'}
            </label>
            <textarea
              className="input"
              placeholder={isLostItem
                ? 'Describe where you found it, its current condition, and where you deposited it or how the owner can collect it…'
                : 'Describe distinguishing features, when & where you lost it, receipt or serial number, unique marks…'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              minLength={10}
            />
            <span className={`label-sm ${description.length >= 10 ? 'text-secondary' : 'text-on-variant'}`}>
              {description.length}/10 min characters
            </span>
          </div>

          {/* Proof images */}
          <div className="input-group">
            <label className="input-label">
              {isLostItem ? 'Photo of found item (optional)' : 'Proof images (optional)'}
            </label>
            <p className="body-sm text-on-variant" style={{ marginBottom: 8 }}>
              {isLostItem
                ? 'Upload a photo of the item as you found it to help the owner confirm'
                : 'Upload receipts, photos of the matching item, warranty cards, etc.'}
            </p>
            <label className={styles.proofUpload}>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              <span className={styles.proofUploadIcon}>📎</span>
              <span className="label-md">{proofFiles.length > 0 ? `${proofFiles.length} file(s) selected` : 'Choose files…'}</span>
            </label>
            {proofFiles.length > 0 && (
              <div className={styles.proofPreviews}>
                {proofFiles.map((src, i) => (
                  <img key={i} src={src} alt={`Proof ${i + 1}`} className={styles.proofPreviewImg} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.claimActions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || description.trim().length < 10}>
              {submitting ? '⏳ Submitting…' : isLostItem ? '📍 Submit Find Report' : '📩 Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Status Stepper ───────────────────────────────────────────
function StatusStepper({ status }: { status: string }) {
  const currentIdx = getStepIndex(status);

  return (
    <div className={styles.stepper}>
      {STATUS_STEPS.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className={styles.stepWrapper}>
            <div className={`${styles.stepNode} ${isCompleted ? styles.stepCompleted : ''} ${isCurrent ? styles.stepCurrent : ''}`}>
              {isCompleted ? '✓' : step.icon}
            </div>
            <span className={`label-sm ${isCurrent ? 'text-primary' : 'text-on-variant'}`}>{step.label}</span>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`${styles.stepLine} ${isCompleted ? styles.stepLineCompleted : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Claims List (Owner view) ─────────────────────────────────
function ClaimsList({
  claims, onReview, reviewing,
}: {
  claims: Claim[];
  onReview: (claimId: string, action: 'approve' | 'reject', note?: string) => void;
  reviewing: string | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  if (claims.length === 0) {
    return (
      <div className={styles.claimsEmpty}>
        <span className={styles.claimsEmptyIcon}>📭</span>
        <p className="body-md text-on-variant">No claims yet</p>
      </div>
    );
  }

  const pending = claims.filter((c) => c.status === 'PENDING');
  const reviewed = claims.filter((c) => c.status !== 'PENDING');

  return (
    <div className={styles.claimsList}>
      {pending.length > 0 && (
        <>
          <div className={styles.claimsSectionLabel}>
            <span className="badge badge-pending">{pending.length} Pending</span>
          </div>
          {pending.map((claim, i) => (
            <div key={claim.id} className={styles.claimCard} style={{ animationDelay: `${i * 80}ms` }}>
              <div className={styles.claimCardHeader}>
                <div className={styles.claimantInfo}>
                  <div className={styles.claimantAvatar}>
                    {claim.claimant.avatar ? <img src={claim.claimant.avatar} alt="" /> : <span>{claim.claimant.name[0]?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <div className="title-sm">{claim.claimant.name}</div>
                    <div className="label-sm text-on-variant">
                      {claim.claimant.department && `${claim.claimant.department} • `}
                      {new Date(claim.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setExpandedId(expandedId === claim.id ? null : claim.id)}
                >
                  {expandedId === claim.id ? '▲ Less' : '▼ More'}
                </button>
              </div>

              <p className={`body-md ${styles.claimDesc}`}>{claim.description}</p>

              {expandedId === claim.id && (
                <div className={styles.claimExpanded}>
                  {claim.proofImages && claim.proofImages.length > 0 && (
                    <div className={styles.proofGallery}>
                      <div className="label-sm text-on-variant" style={{ marginBottom: 8 }}>📎 Proof attachments</div>
                      <div className={styles.proofPreviews}>
                        {claim.proofImages.map((img, idx) => (
                          <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                            <img src={img} alt={`Proof ${idx + 1}`} className={styles.proofPreviewImg} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={styles.claimantContact}>
                    <div className="label-sm text-on-variant">Contact info</div>
                    {claim.claimant.email && <div className="body-sm">📧 <a href={`mailto:${claim.claimant.email}`}>{claim.claimant.email}</a></div>}
                    {claim.claimant.phone && <div className="body-sm">📱 <a href={`tel:${claim.claimant.phone}`}>{claim.claimant.phone}</a></div>}
                  </div>
                </div>
              )}

              <div className={styles.claimReviewActions}>
                <input
                  className={`input ${styles.reviewNoteInput}`}
                  placeholder="Optional note to claimant…"
                  value={rejectNotes[claim.id] || ''}
                  onChange={(e) => setRejectNotes({ ...rejectNotes, [claim.id]: e.target.value })}
                />
                <button
                  className={`btn btn-danger btn-sm ${styles.rejectBtn}`}
                  onClick={() => onReview(claim.id, 'reject', rejectNotes[claim.id])}
                  disabled={reviewing === claim.id}
                >
                  {reviewing === claim.id ? '…' : '✕ Reject'}
                </button>
                <button
                  className={`btn btn-primary btn-sm ${styles.approveBtn}`}
                  onClick={() => onReview(claim.id, 'approve', rejectNotes[claim.id])}
                  disabled={reviewing === claim.id}
                >
                  {reviewing === claim.id ? '…' : '✓ Approve'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {reviewed.length > 0 && (
        <>
          <div className={styles.claimsSectionLabel}>
            <span className="label-md text-on-variant">Past Claims</span>
          </div>
          {reviewed.map((claim) => (
            <div key={claim.id} className={`${styles.claimCard} ${styles.claimCardReviewed}`}>
              <div className={styles.claimCardHeader}>
                <div className={styles.claimantInfo}>
                  <div className={styles.claimantAvatar}>
                    {claim.claimant.avatar ? <img src={claim.claimant.avatar} alt="" /> : <span>{claim.claimant.name[0]?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <div className="title-sm">{claim.claimant.name}</div>
                    <div className="label-sm text-on-variant">
                      {new Date(claim.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <span className={`badge ${claim.status === 'APPROVED' ? 'badge-claimed' : 'badge-lost'}`}>
                  {claim.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
                </span>
              </div>
              <p className="body-sm text-on-variant">{claim.description.slice(0, 100)}{claim.description.length > 100 ? '…' : ''}</p>
              {claim.reviewNote && <p className="body-sm" style={{ fontStyle: 'italic', marginTop: 4 }}>💬 "{claim.reviewNote}"</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ItemDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/items/${id}`)
      .then((r) => r.json())
      .then((d) => { setItem(d.item); setLoading(false); })
      .catch(() => { toast.error('Failed to load item'); setLoading(false); });
  }, [id]);

  const handleClaimSubmitted = (claim: Claim) => {
    setShowClaimModal(false);
    setItem((prev) => prev ? {
      ...prev,
      status: 'PENDING_CLAIM',
      claims: [claim, ...(prev.claims ?? [])],
    } : prev);
  };

  const handleReview = async (claimId: string, action: 'approve' | 'reject', note?: string) => {
    if (action === 'approve' && !confirm('Approve this claim? This will mark the item as claimed.')) return;
    setReviewing(claimId);
    try {
      const res = await fetch(`/api/items/${item!.id}/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNote: note }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(action === 'approve' ? 'Claim approved! ✅' : 'Claim rejected');
        setItem((prev) => prev ? { ...prev, ...data.item, claims: data.claims } : prev);
      } else {
        toast.error(data.error ?? 'Failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setReviewing(null);
    }
  };

  const handleResolve = async () => {
    if (!item) return;
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    if (res.ok) {
      toast.success('Item resolved! 🎉');
      setItem((prev) => prev ? { ...prev, status: 'RESOLVED' } : prev);
    } else toast.error('Failed to resolve');
  };

  const handleDelete = async () => {
    if (!item || !confirm('Delete this item permanently?')) return;
    const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Item deleted'); router.push('/dashboard'); }
    else toast.error('Failed to delete');
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className={styles.spinner} /></div>;
  if (!item) return <div style={{ padding: 32 }}>Item not found. <Link href="/dashboard">Go back</Link></div>;

  const isOwner = session?.user?.id === item.userId;
  const formattedDate = new Date(item.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const claims = item.claims ?? [];
  const myClaim = claims.find((c) => c.claimantId === session?.user?.id);
  const pendingClaims = claims.filter((c) => c.status === 'PENDING');
  const approvedClaim = claims.find((c) => c.status === 'APPROVED');

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const createdAt = new Date(item.createdAt);
  const timeDiff = now.getTime() - createdAt.getTime();
  const canDelete = timeDiff >= SEVEN_DAYS_MS || session?.user?.role === 'ADMIN';
  const unlockDate = new Date(createdAt.getTime() + SEVEN_DAYS_MS).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-content ${styles.main}`}>
        {/* Breadcrumb */}
        <div className={`glass ${styles.breadcrumb}`}>
          <Link href="/dashboard" className={styles.breadcrumbLink}>← Home Feed</Link>
          <span className="text-on-variant"> / </span>
          <span className="label-md">{item.title}</span>
        </div>

        <div className={styles.content}>
          {/* Status Stepper */}
          <StatusStepper status={item.status} />

          <div className={styles.grid}>
            {/* Left: Images */}
            <div className={styles.imageSection}>
              <div className={styles.mainImage}>
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[activeImg]} alt={item.title} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>{CATEGORY_EMOJI[item.category]}</span>
                  </div>
                )}
                <div className={styles.imageStatus}><StatusBadge type={item.type} status={item.status} /></div>
              </div>
              {item.images && item.images.length > 1 && (
                <div className={styles.thumbs}>
                  {item.images.map((img, i) => (
                    <button key={i} className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`} onClick={() => setActiveImg(i)}>
                      <img src={img} alt="" />
                    </button>
                  ))}
                </div>
              )}

              {/* Claims Management Panel (Owner only) */}
              {isOwner && (
                <div className={styles.claimsPanel}>
                  <div className={styles.claimsPanelHeader}>
                    <h3 className="headline-sm">📋 Claims</h3>
                    {pendingClaims.length > 0 && (
                      <span className="badge badge-pending">{pendingClaims.length} pending</span>
                    )}
                  </div>
                  <ClaimsList claims={claims} onReview={handleReview} reviewing={reviewing} />
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className={styles.details}>
              <div className={styles.detailsHeader}>
                <div className={styles.category}>
                  <span>{CATEGORY_EMOJI[item.category]}</span>
                  <span className="label-sm text-on-variant">{item.category.replace('_', ' ')}</span>
                </div>
                <h1 className="display-sm">{item.title}</h1>
              </div>

              <div className={styles.metaCards}>
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}>📍</span>
                  <div><div className="label-sm text-on-variant">Location</div><div className="title-sm">{item.location}</div></div>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}>📅</span>
                  <div><div className="label-sm text-on-variant">Date</div><div className="title-sm">{formattedDate}</div></div>
                </div>
                <div className={styles.metaCard}>
                  <span className={styles.metaIcon}>🏫</span>
                  <div><div className="label-sm text-on-variant">College</div><div className="title-sm">{item.campus}</div></div>
                </div>
                {item.brand && (
                  <div className={styles.metaCard}>
                    <span className={styles.metaIcon}>🏷️</span>
                    <div><div className="label-sm text-on-variant">Brand</div><div className="title-sm">{item.brand}</div></div>
                  </div>
                )}
                {item.color && (
                  <div className={styles.metaCard}>
                    <span className={styles.metaIcon}>🎨</span>
                    <div><div className="label-sm text-on-variant">Color</div><div className="title-sm">{item.color}</div></div>
                  </div>
                )}
                {item.serialNumber && (
                  <div className={styles.metaCard}>
                    <span className={styles.metaIcon}>🔢</span>
                    <div><div className="label-sm text-on-variant">Serial / ID</div><div className="title-sm">{item.serialNumber}</div></div>
                  </div>
                )}
              </div>

              <div className={styles.descSection}>
                <div className="label-md text-on-variant">Description</div>
                <p className="body-lg">{item.description}</p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className={styles.tags}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}

              {/* Poster Card */}
              <div className={styles.posterCard}>
                <div className={styles.posterAvatar}>
                  {item.user.avatar ? <img src={item.user.avatar} alt="" /> : <span>{item.user.name[0]?.toUpperCase()}</span>}
                </div>
                <div className={styles.posterInfo}>
                  <div className="title-sm">{item.user.name}</div>
                  {item.user.department && <div className="label-sm text-on-variant">{item.user.department}</div>}
                </div>
                {!isOwner && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowContact(!showContact)}>
                    {showContact ? 'Hide' : '📞 Contact'}
                  </button>
                )}
              </div>

              {showContact && !isOwner && (
                <div className={styles.contactBox}>
                  {item.user.email && <div><strong>Email:</strong> <a href={`mailto:${item.user.email}`}>{item.user.email}</a></div>}
                  {item.user.phone && <div><strong>Phone:</strong> <a href={`tel:${item.user.phone}`}>{item.user.phone}</a></div>}
                  {item.contactInfo && <div><strong>Note:</strong> {item.contactInfo}</div>}
                </div>
              )}

              {/* Approved claimant info */}
              {approvedClaim && (
                <div className={styles.approvedClaimant}>
                  <div className={styles.approvedClaimantHeader}>
                    <span className={styles.approvedIcon}>🏆</span>
                    <span className="title-sm">Claimed by</span>
                  </div>
                  <div className={styles.claimantInfo}>
                    <div className={styles.claimantAvatar}>
                      {approvedClaim.claimant.avatar
                        ? <img src={approvedClaim.claimant.avatar} alt="" />
                        : <span>{approvedClaim.claimant.name[0]?.toUpperCase()}</span>}
                    </div>
                    <div>
                      <div className="title-sm">{approvedClaim.claimant.name}</div>
                      {approvedClaim.claimant.department && <div className="label-sm text-on-variant">{approvedClaim.claimant.department}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* My claim status (non-owner) */}
              {!isOwner && myClaim && (
                <div className={`${styles.myClaimStatus} ${styles[`myClaim_${myClaim.status}`]}`}>
                  <div className={styles.myClaimIcon}>
                    {myClaim.status === 'PENDING' && '⏳'}
                    {myClaim.status === 'APPROVED' && '🎉'}
                    {myClaim.status === 'REJECTED' && '❌'}
                  </div>
                  <div>
                    <div className="title-sm">
                      {myClaim.status === 'PENDING' && 'Your claim is pending review'}
                      {myClaim.status === 'APPROVED' && 'Your claim was approved!'}
                      {myClaim.status === 'REJECTED' && 'Your claim was rejected'}
                    </div>
                    <div className="body-sm text-on-variant">
                      Submitted {new Date(myClaim.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {myClaim.reviewNote && <div className="body-sm" style={{ marginTop: 4, fontStyle: 'italic' }}>💬 "{myClaim.reviewNote}"</div>}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                {/* Non-owner: can submit a claim if item is active/pending and they don't have a pending claim */}
                {!isOwner && (item.status === 'ACTIVE' || item.status === 'PENDING_CLAIM') && !myClaim && (
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setShowClaimModal(true)}>
                    {item.type === 'FOUND' ? '🎉 This is Mine!' : '✅ I Found This!'}
                  </button>
                )}

                {/* Owner actions */}
                {isOwner && (
                  <>
                    {(item.status === 'ACTIVE' || item.status === 'CLAIMED' || item.status === 'PENDING_CLAIM') && (
                      <button className="btn btn-secondary btn-lg" onClick={handleResolve} style={{ flex: 1 }}>
                        ✅ Mark as Resolved
                      </button>
                    )}
                    {canDelete ? (
                      <button className="btn btn-danger btn-lg" onClick={handleDelete}>🗑 Delete</button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <button className="btn btn-danger btn-lg" disabled style={{ opacity: 0.6, cursor: 'not-allowed', width: '100%' }}>
                          🔒 Delete Locked
                        </button>
                        <span className="label-sm text-on-variant" style={{ textAlign: 'center' }}>
                          This post can be deleted after {unlockDate}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {item.status === 'RESOLVED' && (
                  <div className={`badge badge-claimed ${styles.resolvedBadge}`}>✔ This item has been resolved</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Claim Modal */}
      {showClaimModal && item && (
        <ClaimModal item={item} onClose={() => setShowClaimModal(false)} onSubmitted={handleClaimSubmitted} />
      )}
    </div>
  );
}
