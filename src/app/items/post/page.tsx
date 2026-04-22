'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import styles from './page.module.css';

const CATEGORIES = [
  { value: 'ELECTRONICS', emoji: '💻', label: 'Electronics' },
  { value: 'CLOTHING', emoji: '👕', label: 'Clothing' },
  { value: 'ACCESSORIES', emoji: '👜', label: 'Accessories' },
  { value: 'BOOKS', emoji: '📚', label: 'Books' },
  { value: 'STATIONERY', emoji: '✏️', label: 'Stationery' },
  { value: 'KEYS', emoji: '🔑', label: 'Keys' },
  { value: 'WALLET', emoji: '👛', label: 'Wallet' },
  { value: 'ID_CARD', emoji: '🪪', label: 'ID Card' },
  { value: 'SPORTS', emoji: '⚽', label: 'Sports' },
  { value: 'OTHER', emoji: '📦', label: 'Other' },
];

const COLLEGES = ['SCOE', 'BVCOE', 'RAIT', 'DJSCE'];

const STEPS_LOST = [
  { label: 'Type', icon: '📋' },
  { label: 'Details', icon: '✏️' },
  { label: 'When & Where', icon: '📍' },
  { label: 'Photos', icon: '📷' },
  { label: 'Review', icon: '✅' },
];

const STEPS_FOUND = [
  { label: 'Type', icon: '📋' },
  { label: 'Details', icon: '✏️' },
  { label: 'Where Found', icon: '📍' },
  { label: 'Photos', icon: '📷' },
  { label: 'Review', icon: '✅' },
];

const TIPS_LOST: Record<number, string[]> = {
  1: [
    '💡 A detailed title increases match accuracy by 3x',
    '💡 Include color, brand, and model in the title',
    '💡 Example: "Black Apple AirPods Pro with orange case"',
  ],
  2: [
    '📍 Be as specific as possible about the last known location',
    '⏰ The more accurate the date and time, the better',
    '📱 Adding a serial number or IMEI makes identification definitive',
  ],
  3: [
    '📸 Items with photos are recovered 4x more often',
    '🔍 Show any distinguishing marks, stickers, or damage',
    '📐 Take photos from multiple angles',
  ],
};

const TIPS_FOUND: Record<number, string[]> = {
  1: [
    '💡 Describe the item without revealing private info',
    '⚠️ Do NOT include serial numbers — let the owner prove it',
    '💡 Example: "Blue leather wallet found near cafeteria"',
  ],
  2: [
    '📍 Where exactly did you find it?',
    '🔐 It\'s now with you or deposited at the lost-and-found?',
    '📞 Adding contact preferences helps the owner reach you faster',
  ],
  3: [
    '📸 A photo helps owners instantly recognize their item',
    '⚠️ Blur or crop any personal info visible on the item',
    '🖼️ Show the item as-is, without opening sealed containers',
  ],
};

export default function PostItemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTip, setActiveTip] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    type: '' as 'LOST' | 'FOUND' | '',
    title: '', description: '', category: '', location: '', campus: '',
    brand: '', color: '', serialNumber: '',
    date: new Date().toISOString().slice(0, 10),
    time: '',
    tags: '', contactInfo: '',
    images: [] as string[],
    depositedAt: '', // For found items: where did you deposit it?
  });
  const [previews, setPreviews] = useState<string[]>([]);

  if (status === 'unauthenticated') { router.push('/auth/signin'); return null; }

  // Rotate tips
  useEffect(() => {
    const tips = form.type === 'FOUND' ? TIPS_FOUND : TIPS_LOST;
    const currentTips = tips[step];
    if (!currentTips || currentTips.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTip((prev) => (prev + 1) % currentTips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [step, form.type]);

  // Reset tip index on step change
  useEffect(() => { setActiveTip(0); }, [step]);

  const STEPS = form.type === 'FOUND' ? STEPS_FOUND : STEPS_LOST;
  const tips = form.type === 'FOUND' ? TIPS_FOUND : TIPS_LOST;
  const currentTips = tips[step];

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleImages = (files: File[]) => {
    const remaining = 4 - previews.length;
    if (remaining <= 0) { toast.error('Max 4 images'); return; }
    const toProcess = files.slice(0, remaining);
    toProcess.forEach((file) => {
      if (file.size > 4 * 1024 * 1024) { toast.error(`${file.name} exceeds 4MB`); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setForm((p) => ({ ...p, images: [...p.images, base64] }));
        setPreviews((p) => [...p, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImages(Array.from(e.target.files ?? []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleImages(files);
  };

  const removeImage = (i: number) => {
    setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const titleCharCount = form.title.length;
  const descCharCount = form.description.length;
  const completionScore = (() => {
    let score = 0;
    if (form.title) score += 20;
    if (form.description && form.description.length >= 20) score += 20;
    if (form.category) score += 15;
    if (form.location) score += 15;
    if (form.images.length > 0) score += 15;
    if (form.brand || form.color || form.serialNumber) score += 10;
    if (form.tags) score += 5;
    return Math.min(100, score);
  })();

  const validate = (): boolean => {
    if (step === 0 && !form.type) { toast.error('Select Lost or Found'); return false; }
    if (step === 1) {
      if (!form.title || form.title.length < 3) { toast.error('Title must be at least 3 characters'); return false; }
      if (!form.description || form.description.length < 10) { toast.error('Description must be at least 10 characters'); return false; }
      if (!form.category) { toast.error('Please select a category'); return false; }
    }
    if (step === 2 && (!form.location || !form.date)) { toast.error('Location and date are required'); return false; }
    return true;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, 4)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        brand: form.brand || null,
        color: form.color || null,
        serialNumber: form.serialNumber || null,
        contactInfo: form.contactInfo || (form.depositedAt ? `Deposited at: ${form.depositedAt}` : null),
      };
      delete (payload as any).time;
      delete (payload as any).depositedAt;

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to post item'); return; }
      toast.success(form.type === 'LOST' ? 'Lost item reported! We\'ll help you find it 🔍' : 'Found item posted! The owner will thank you 🎉');
      router.push(`/items/${data.item.id}`);
    } catch {
      toast.error('Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-content ${styles.main}`}>
        <div className={`glass ${styles.header}`}>
          <Link href="/dashboard" className={styles.back}>← Back</Link>
          <h1 className="headline-lg">
            {form.type === 'LOST' ? '🔴 Report Lost Item' : form.type === 'FOUND' ? '🟢 Report Found Item' : 'Post an Item'}
          </h1>
          <div />
        </div>

        <div className={styles.formWrapper}>
          {/* Progress */}
          <div className={styles.progress}>
            {STEPS.map((s, i) => (
              <div key={s.label} className={`${styles.progressStep} ${i <= step ? styles.progressActive : ''} ${i < step ? styles.progressDone : ''}`}>
                <div className={styles.stepCircle}>{i < step ? '✓' : s.icon}</div>
                <div className={styles.stepLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Contextual tips */}
          {currentTips && step > 0 && step < 4 && (
            <div className={styles.tipBar}>
              <div className={styles.tipContent} key={activeTip}>
                {currentTips[activeTip]}
              </div>
              <div className={styles.tipDots}>
                {currentTips.map((_, i) => (
                  <span key={i} className={`${styles.tipDot} ${i === activeTip ? styles.tipDotActive : ''}`}
                    onClick={() => setActiveTip(i)} />
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          <div className={styles.stepContent}>

            {/* Step 0: Type */}
            {step === 0 && (
              <div className={styles.typeStep}>
                <div className={styles.typeStepHeader}>
                  <h2 className="display-sm">What are you reporting?</h2>
                  <p className="body-md text-on-variant">Choose the type that matches your situation</p>
                </div>
                <div className={styles.typeCards}>
                  <button
                    className={`${styles.typeCard} ${styles.lostCard} ${form.type === 'LOST' ? styles.typeCardActive : ''}`}
                    onClick={() => setForm((p) => ({ ...p, type: 'LOST' }))}
                  >
                    <div className={styles.typeCardIcon}>🔍</div>
                    <h3 className="headline-sm">I Lost Something</h3>
                    <p className="body-sm text-on-variant">Report a missing item so others can help locate it</p>
                    <div className={styles.typeCardFeatures}>
                      <span>📢 Broadcast to campus</span>
                      <span>🤖 AI matching</span>
                      <span>🔔 Get notified</span>
                    </div>
                  </button>
                  <button
                    className={`${styles.typeCard} ${styles.foundCard} ${form.type === 'FOUND' ? styles.typeCardActive : ''}`}
                    onClick={() => setForm((p) => ({ ...p, type: 'FOUND' }))}
                  >
                    <div className={styles.typeCardIcon}>📦</div>
                    <h3 className="headline-sm">I Found Something</h3>
                    <p className="body-sm text-on-variant">Help reunite someone with their belongings</p>
                    <div className={styles.typeCardFeatures}>
                      <span>🛡️ Verified claims</span>
                      <span>🤖 Auto-match</span>
                      <span>🏆 Good karma</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Details */}
            {step === 1 && (
              <div className={styles.formFields}>
                <div className={styles.stepHeader}>
                  <h2 className="headline-lg">
                    {form.type === 'LOST' ? '📝 Describe the lost item' : '📝 Describe what you found'}
                  </h2>
                  <p className="body-sm text-on-variant">
                    {form.type === 'LOST'
                      ? 'Be specific — the more details, the higher the chance of recovery'
                      : 'Describe the item without revealing sensitive information'}
                  </p>
                </div>

                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input className="input" type="text"
                    placeholder={form.type === 'LOST' ? 'e.g. Black Apple AirPods Pro with orange case' : 'e.g. Blue leather wallet found near cafeteria'}
                    value={form.title} onChange={set('title')} required maxLength={100} />
                  <div className={styles.charCounter}>
                    <span className={titleCharCount < 3 ? 'text-error' : 'text-secondary'}>{titleCharCount}/100</span>
                    {titleCharCount >= 3 && <span className={styles.checkMark}>✓</span>}
                  </div>
                </div>

                {/* Category picker */}
                <div className="input-group">
                  <label className="input-label">Category *</label>
                  <div className={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => (
                      <button key={cat.value} type="button"
                        className={`${styles.categoryChip} ${form.category === cat.value ? styles.categoryChipActive : ''}`}
                        onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                      >
                        <span className={styles.categoryEmoji}>{cat.emoji}</span>
                        <span className={styles.categoryLabel}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label">Brand / Model <span className="text-on-variant">(optional)</span></label>
                    <input className="input" type="text" placeholder="e.g. Apple, Samsung, Dell" value={form.brand} onChange={set('brand')} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Color <span className="text-on-variant">(optional)</span></label>
                    <input className="input" type="text" placeholder="e.g. Space Grey, Crimson" value={form.color} onChange={set('color')} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Description *</label>
                  <textarea className="input" rows={4}
                    placeholder={form.type === 'LOST'
                      ? 'Include size, distinguishing marks, unique features, stickers, scratches, case type…'
                      : 'Describe the item appearance without sharing private details like names, IDs, or phone numbers visible on it…'}
                    value={form.description} onChange={set('description')} required minLength={10} />
                  <div className={styles.charCounter}>
                    <span className={descCharCount < 10 ? 'text-error' : 'text-secondary'}>{descCharCount}/10+ chars</span>
                    {descCharCount >= 10 && <span className={styles.checkMark}>✓</span>}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Tags <span className="text-on-variant">(comma-separated, optional)</span></label>
                  <input className="input" type="text" placeholder="e.g. blue, leather, notebook, cracked-screen" value={form.tags} onChange={set('tags')} />
                  {form.tags && (
                    <div className={styles.tagPreview}>
                      {form.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                        <span key={i} className={styles.tagChip}>#{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Location & Date */}
            {step === 2 && (
              <div className={styles.formFields}>
                <div className={styles.stepHeader}>
                  <h2 className="headline-lg">
                    {form.type === 'LOST' ? '📍 When & where did you lose it?' : '📍 Where did you find it?'}
                  </h2>
                  <p className="body-sm text-on-variant">
                    {form.type === 'LOST'
                      ? 'Help us narrow down the search area'
                      : 'Let the owner know where to look or collect'}
                  </p>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    {form.type === 'LOST' ? 'Last seen location *' : 'Where did you find it? *'}
                  </label>
                  <input className="input" type="text"
                    placeholder={form.type === 'LOST' ? 'e.g. Central Library 3rd floor, Table near window' : 'e.g. Parking lot B, near the bike stand'}
                    value={form.location} onChange={set('location')} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label">Date *</label>
                    <input className="input" type="date" value={form.date} onChange={set('date')} max={new Date().toISOString().slice(0, 10)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Approximate time <span className="text-on-variant">(optional)</span></label>
                    <input className="input" type="time" value={form.time} onChange={set('time')} />
                  </div>
                </div>

                {form.type === 'LOST' ? (
                  <div className="input-group">
                    <label className="input-label">Serial Number / IMEI <span className="text-on-variant">(optional)</span></label>
                    <input className="input" type="text" placeholder="e.g. IMEI, Serial, Hall ticket no" value={form.serialNumber} onChange={set('serialNumber')} />
                  </div>
                ) : (
                  <div className="input-group">
                    <label className="input-label">Deposited at <span className="text-on-variant">(optional)</span></label>
                    <input className="input" type="text" placeholder="e.g. Security office, reception desk" value={form.depositedAt} onChange={set('depositedAt')} />
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Contact preference <span className="text-on-variant">(optional)</span></label>
                  <input className="input" type="text"
                    placeholder={form.type === 'LOST' ? 'e.g. Call me at 9XXXXXXXX, WhatsApp preferred' : 'e.g. Available Mon-Fri 10am-4pm, WhatsApp only'}
                    value={form.contactInfo} onChange={set('contactInfo')} />
                </div>

                {/* Found item: privacy reminder */}
                {form.type === 'FOUND' && (
                  <div className={styles.privacyReminder}>
                    <span className={styles.privacyIcon}>🛡️</span>
                    <div>
                      <div className="title-sm">Privacy Protection</div>
                      <div className="body-sm text-on-variant">
                        Don't share serial numbers or IDs of found items — the rightful owner should provide them during the claim verification process.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Images */}
            {step === 3 && (
              <div className={styles.formFields}>
                <div className={styles.stepHeader}>
                  <h2 className="headline-lg">📸 Add Photos</h2>
                  <p className="body-md text-on-variant">
                    {form.type === 'LOST'
                      ? 'Clear photos drastically increase the chance of recovery. Up to 4 images.'
                      : 'Photo of the found item helps the owner recognize it. Up to 4 images.'}
                  </p>
                </div>

                <div
                  className={`${styles.uploadZone} ${dragOver ? styles.uploadZoneDragOver : ''} ${previews.length >= 4 ? styles.uploadZoneDisabled : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => previews.length < 4 && fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} style={{ display: 'none' }} />
                  {previews.length >= 4 ? (
                    <>
                      <span className={styles.uploadIcon}>✅</span>
                      <span className="title-sm">All 4 slots filled</span>
                      <span className="body-sm text-on-variant">Remove an image to add more</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.uploadIcon}>{dragOver ? '📥' : '📸'}</span>
                      <span className="title-sm">{dragOver ? 'Drop images here' : 'Click or drag images here'}</span>
                      <span className="body-sm text-on-variant">JPG, PNG, WEBP — Max 4MB each — {4 - previews.length} slot{4 - previews.length !== 1 ? 's' : ''} remaining</span>
                    </>
                  )}
                </div>

                {previews.length > 0 && (
                  <div className={styles.imagePreviews}>
                    {previews.map((src, i) => (
                      <div key={i} className={styles.previewWrap}>
                        <img src={src} alt="" />
                        <button className={styles.removeImg} onClick={() => removeImage(i)} title="Remove">✕</button>
                        {i === 0 && <span className={styles.primaryLabel}>Primary</span>}
                      </div>
                    ))}
                  </div>
                )}

                {form.type === 'FOUND' && (
                  <div className={styles.privacyReminder}>
                    <span className={styles.privacyIcon}>⚠️</span>
                    <div>
                      <div className="title-sm">Photo Privacy</div>
                      <div className="body-sm text-on-variant">
                        If the item displays personal information (ID cards, documents), blur or crop sensitive details before uploading.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className={styles.review}>
                <div className={styles.stepHeader}>
                  <h2 className="headline-lg">📋 Review & Submit</h2>
                  <p className="body-sm text-on-variant">Double-check your details before publishing</p>
                </div>

                {/* Completion score */}
                <div className={styles.completionBar}>
                  <div className={styles.completionHeader}>
                    <span className="label-md">Listing Quality</span>
                    <span className={`title-sm ${completionScore >= 80 ? 'text-secondary' : completionScore >= 50 ? '' : 'text-error'}`}>
                      {completionScore}%
                      {completionScore >= 80 ? ' — Excellent!' : completionScore >= 50 ? ' — Good' : ' — Needs more detail'}
                    </span>
                  </div>
                  <div className={styles.completionTrack}>
                    <div className={styles.completionFill} style={{ width: `${completionScore}%` }} />
                  </div>
                </div>

                <div className={styles.reviewCard}>
                  {/* Type & Title */}
                  <div className={styles.reviewHeader}>
                    <span className={`badge ${form.type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                      {form.type === 'LOST' ? '🔴 Lost' : '🟢 Found'}
                    </span>
                    <h3 className="headline-md">{form.title}</h3>
                  </div>

                  {/* Meta grid */}
                  <div className={styles.reviewMeta}>
                    <div className={styles.reviewMetaItem}>
                      <span className="label-sm text-on-variant">Category</span>
                      <span className="title-sm">{CATEGORIES.find(c => c.value === form.category)?.emoji} {form.category.replace('_', ' ')}</span>
                    </div>
                    <div className={styles.reviewMetaItem}>
                      <span className="label-sm text-on-variant">Location</span>
                      <span className="title-sm">📍 {form.location}</span>
                    </div>
                    <div className={styles.reviewMetaItem}>
                      <span className="label-sm text-on-variant">Date</span>
                      <span className="title-sm">📅 {new Date(form.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    {session?.user?.campus && (
                      <div className={styles.reviewMetaItem}>
                        <span className="label-sm text-on-variant">College</span>
                        <span className="title-sm">🏫 {session.user.campus}</span>
                      </div>
                    )}
                    {form.brand && (
                      <div className={styles.reviewMetaItem}>
                        <span className="label-sm text-on-variant">Brand</span>
                        <span className="title-sm">🏷️ {form.brand}</span>
                      </div>
                    )}
                    {form.color && (
                      <div className={styles.reviewMetaItem}>
                        <span className="label-sm text-on-variant">Color</span>
                        <span className="title-sm">🎨 {form.color}</span>
                      </div>
                    )}
                    {form.serialNumber && (
                      <div className={styles.reviewMetaItem}>
                        <span className="label-sm text-on-variant">Serial/ID</span>
                        <span className="title-sm">🔢 {form.serialNumber}</span>
                      </div>
                    )}
                    {form.time && (
                      <div className={styles.reviewMetaItem}>
                        <span className="label-sm text-on-variant">Time</span>
                        <span className="title-sm">🕐 {form.time}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className={styles.reviewDesc}>
                    <span className="label-md text-on-variant">Description</span>
                    <p className="body-md">{form.description}</p>
                  </div>

                  {/* Tags */}
                  {form.tags && (
                    <div className={styles.reviewTags}>
                      {form.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                        <span key={i} className={styles.tagChip}>#{tag.trim()}</span>
                      ))}
                    </div>
                  )}

                  {/* Images */}
                  {previews.length > 0 && (
                    <div className={styles.reviewImages}>
                      {previews.map((s, i) => <img key={i} src={s} alt="" />)}
                    </div>
                  )}

                  {/* Contact info */}
                  {(form.contactInfo || form.depositedAt) && (
                    <div className={styles.reviewContact}>
                      <span className="label-sm text-on-variant">📞 Contact / Notes</span>
                      <span className="body-sm">{form.contactInfo || `Deposited at: ${form.depositedAt}`}</span>
                    </div>
                  )}
                </div>

                {/* Missing fields suggestion */}
                {completionScore < 80 && (
                  <div className={styles.suggestionsBar}>
                    <div className="title-sm">💡 Boost your listing quality:</div>
                    <div className={styles.suggestions}>
                      {!form.images.length && <span className={styles.suggestion} onClick={() => setStep(3)}>➕ Add photos</span>}
                      {!form.brand && !form.color && <span className={styles.suggestion} onClick={() => setStep(1)}>➕ Add brand/color</span>}
                      {!form.tags && <span className={styles.suggestion} onClick={() => setStep(1)}>➕ Add tags</span>}
                      {form.description.length < 40 && <span className={styles.suggestion} onClick={() => setStep(1)}>➕ Longer description</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className={styles.navButtons}>
              {step > 0 && <button className="btn btn-secondary btn-lg" onClick={back}>← Back</button>}
              {step < 4 ? (
                <button className="btn btn-primary btn-lg" onClick={next}>
                  {step === 3 && previews.length === 0 ? 'Skip & Continue →' : 'Continue →'}
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                  {loading ? '⏳ Posting…' : form.type === 'LOST' ? '🔍 Report Lost Item' : '📦 Post Found Item'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
