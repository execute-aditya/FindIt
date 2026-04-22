'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import { Match, MatchStats, Item } from '@/types';
import styles from './page.module.css';

const CONFIDENCE_CONFIG = {
  HIGH: { label: 'High Confidence', color: '#1b5e20', bg: '#e8f5e9', icon: '🔥' },
  MEDIUM: { label: 'Medium', color: '#e65100', bg: '#fff3e0', icon: '⚡' },
  LOW: { label: 'Possible', color: '#546e7a', bg: '#eceff1', icon: '🔍' },
};

type ViewTab = 'matches' | 'search';

export default function MatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data
  const [matches, setMatches] = useState<Match[]>([]);
  const [reverseMatches, setReverseMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState<ViewTab>('matches');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<string>('ALL');
  const [matchTab, setMatchTab] = useState<'lost' | 'found'>('lost');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  // Load matches
  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      setMatches(data.matches ?? []);
      setReverseMatches(data.reverseMatches ?? []);
      setStats(data.stats ?? null);
    } catch {
      toast.error('Failed to load matches');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadMatches();
  }, [status, loadMatches]);

  // Search
  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setTab('search');
    setSearchQuery(searchInput.trim());
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?mode=search&q=${encodeURIComponent(searchInput.trim())}`);
      const data = await res.json();
      setSearchResults(data.searchResults ?? []);
    } catch {
      toast.error('Search failed');
    }
    setLoading(false);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setSearchResults([]);
    setTab('matches');
  };

  // Filtered matches
  const filterByConfidence = (list: Match[]) => {
    if (confidenceFilter === 'ALL') return list;
    return list.filter((m) => m.confidence === confidenceFilter);
  };

  const displayedMatches = filterByConfidence(matchTab === 'lost' ? matches : reverseMatches);

  if (status === 'loading' || (loading && !stats)) return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-content ${styles.main}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingPulse}>
            <div className={styles.brainIcon}>🧠</div>
            <div className={styles.pulseRing} />
            <div className={styles.pulseRing2} />
          </div>
          <h3 className="headline-sm">Analysing items…</h3>
          <p className="body-md text-on-variant">Running smart matching across your campus</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-content ${styles.main}`}>
        {/* Header */}
        <div className={`glass ${styles.header}`}>
          <div className={styles.headerTop}>
            <div>
              <h1 className="headline-lg">🧠 AI Smart Search</h1>
              <p className="body-md text-on-variant">Intelligent matching & campus-wide item search</p>
            </div>
            {stats && (
              <div className={styles.statChips}>
                <div className={styles.statChip}>
                  <span className={styles.statNumber}>{stats.matchesFound}</span>
                  <span className={styles.statLabel}>Matches</span>
                </div>
                <div className={styles.statChip}>
                  <span className={styles.statNumber}>{stats.yourLostItems}</span>
                  <span className={styles.statLabel}>Your Lost</span>
                </div>
                <div className={styles.statChip}>
                  <span className={styles.statNumber}>{stats.totalFoundOnCampus}</span>
                  <span className={styles.statLabel}>Found on Campus</span>
                </div>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search items… e.g. &quot;black iPhone near library&quot; or &quot;blue wallet cafeteria&quot;"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchInput && (
              <button className={styles.clearBtn} onClick={clearSearch}>✕</button>
            )}
            <button className={styles.searchBtn} onClick={handleSearch} disabled={!searchInput.trim()}>
              Search
            </button>
          </div>

          {/* Tabs */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${tab === 'matches' ? styles.tabActive : ''}`}
              onClick={() => { setTab('matches'); clearSearch(); }}
            >
              🤖 Smart Matches {(matches.length + reverseMatches.length) > 0 && (
                <span className={styles.tabBadge}>{matches.length + reverseMatches.length}</span>
              )}
            </button>
            <button
              className={`${styles.tab} ${tab === 'search' ? styles.tabActive : ''}`}
              onClick={() => setTab('search')}
            >
              🔎 Search Results {searchResults.length > 0 && (
                <span className={styles.tabBadge}>{searchResults.length}</span>
              )}
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {/* ═══ Matches Tab ═══ */}
          {tab === 'matches' && (
            <>
              {/* Sub-tabs: Your Lost vs Your Found */}
              <div className={styles.matchTabBar}>
                <button className={`${styles.matchTabBtn} ${matchTab === 'lost' ? styles.matchTabActive : ''}`}
                  onClick={() => setMatchTab('lost')}>
                  🔴 Matches for Your Lost Items
                  {matches.length > 0 && <span className={styles.matchTabCount}>{matches.length}</span>}
                </button>
                <button className={`${styles.matchTabBtn} ${matchTab === 'found' ? styles.matchTabActive : ''}`}
                  onClick={() => setMatchTab('found')}>
                  🟢 Matches for Your Found Items
                  {reverseMatches.length > 0 && <span className={styles.matchTabCount}>{reverseMatches.length}</span>}
                </button>
              </div>

              {/* Confidence filter */}
              {displayedMatches.length > 0 && (
                <div className={styles.filters}>
                  {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((c) => (
                    <button key={c} className={`${styles.filterChip} ${confidenceFilter === c ? styles.filterChipActive : ''}`}
                      onClick={() => setConfidenceFilter(c)}>
                      {c === 'ALL' ? '📊 All' : `${CONFIDENCE_CONFIG[c as keyof typeof CONFIDENCE_CONFIG].icon} ${CONFIDENCE_CONFIG[c as keyof typeof CONFIDENCE_CONFIG].label}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Match cards */}
              {displayedMatches.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>
                    {matchTab === 'lost' ? '🔍' : '📦'}
                  </div>
                  <h3 className="headline-sm">
                    {matchTab === 'lost' ? 'No matches for your lost items' : 'No matches for your found items'}
                  </h3>
                  <p className="body-md text-on-variant">
                    {matchTab === 'lost'
                      ? 'Post a lost item — we\'ll continuously scan all found reports'
                      : 'When someone reports a matching lost item, matches will appear here'}
                  </p>
                  <Link href="/items/post" className="btn btn-primary">
                    {matchTab === 'lost' ? '🔴 Report Lost Item' : '🟢 Post Found Item'}
                  </Link>
                </div>
              ) : (
                <div className={styles.matchList}>
                  {displayedMatches.map((match, i) => {
                    const conf = CONFIDENCE_CONFIG[match.confidence];
                    const isExpanded = expandedCard === i;
                    const yourItem = matchTab === 'lost' ? match.lostItem : match.foundItem;
                    const otherItem = matchTab === 'lost' ? match.foundItem : match.lostItem;

                    return (
                      <div key={i} className={styles.matchCard} style={{ animationDelay: `${i * 80}ms` }}>
                        {/* Score strip */}
                        <div className={styles.scoreStrip} style={{ background: conf.bg }}>
                          <div className={styles.scoreLeft}>
                            <div className={styles.scoreRing} style={{ '--score': match.score, '--color': conf.color } as any}>
                              <span className={styles.scoreText} style={{ color: conf.color }}>
                                {Math.round(match.score * 100)}%
                              </span>
                            </div>
                            <div>
                              <div className="title-md" style={{ color: conf.color }}>
                                {conf.icon} {conf.label} Match
                              </div>
                              <div className="label-sm text-on-variant">
                                {match.reasons.length} matching factors
                              </div>
                            </div>
                          </div>
                          <button className={styles.expandBtn} onClick={() => setExpandedCard(isExpanded ? null : i)}>
                            {isExpanded ? '▲ Less' : '▼ Details'}
                          </button>
                        </div>

                        {/* Factor chips */}
                        {isExpanded && (
                          <div className={styles.reasonsPanel}>
                            <div className="label-md text-on-variant" style={{ marginBottom: 8 }}>Match Breakdown</div>
                            <div className={styles.reasonGrid}>
                              {match.reasons.map((r, ri) => (
                                <div key={ri} className={styles.reasonChip}>
                                  <span className={styles.reasonIcon}>{r.icon}</span>
                                  <div>
                                    <div className="label-sm">{r.factor}</div>
                                    <div className={`${styles.weightBadge} ${styles[`weight${r.weight}`]}`}>{r.weight}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Side by side cards */}
                        <div className={styles.matchGrid}>
                          {/* Your item */}
                          <div className={styles.matchItem}>
                            <div className={`badge ${matchTab === 'lost' ? 'badge-lost' : 'badge-found'} ${styles.matchBadge}`}>
                              {matchTab === 'lost' ? '🔴 YOUR LOST ITEM' : '🟢 YOUR FOUND ITEM'}
                            </div>
                            <div className={styles.matchImage}>
                              {yourItem.images?.[0]
                                ? <img src={yourItem.images[0]} alt="" />
                                : <div className={styles.matchImgPlaceholder}>📦</div>}
                            </div>
                            <div className={styles.matchItemBody}>
                              <h3 className="title-md">{yourItem.title}</h3>
                              <p className="body-sm text-on-variant">{yourItem.description.slice(0, 80)}…</p>
                              <div className={styles.matchMeta}>
                                <span>📍 {yourItem.location}</span>
                                {yourItem.brand && <span>🏷️ {yourItem.brand}</span>}
                                {yourItem.color && <span>🎨 {yourItem.color}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Connector */}
                          <div className={styles.connector}>
                            <div className={styles.connectorLine} />
                            <div className={styles.connectorIcon} style={{ background: conf.bg, color: conf.color }}>
                              {Math.round(match.score * 100)}%
                            </div>
                            <div className={styles.connectorLine} />
                          </div>

                          {/* Other item */}
                          <div className={styles.matchItem}>
                            <div className={`badge ${matchTab === 'lost' ? 'badge-found' : 'badge-lost'} ${styles.matchBadge}`}>
                              {matchTab === 'lost' ? '🟢 POTENTIAL MATCH' : '🔴 COULD BE THEIRS'}
                            </div>
                            <div className={styles.matchImage}>
                              {otherItem.images?.[0]
                                ? <img src={otherItem.images[0]} alt="" />
                                : <div className={styles.matchImgPlaceholder}>📦</div>}
                            </div>
                            <div className={styles.matchItemBody}>
                              <h3 className="title-md">{otherItem.title}</h3>
                              <p className="body-sm text-on-variant">{otherItem.description.slice(0, 80)}…</p>
                              <div className={styles.matchMeta}>
                                <span>📍 {otherItem.location}</span>
                                {otherItem.brand && <span>🏷️ {otherItem.brand}</span>}
                                {otherItem.color && <span>🎨 {otherItem.color}</span>}
                              </div>
                              <div className={styles.postedBy}>
                                <span className="label-sm text-on-variant">
                                  Posted by {otherItem.user?.name} • {otherItem.user?.department}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.matchActions}>
                          <Link href={`/items/${otherItem.id}`} className="btn btn-primary btn-sm">
                            👀 View & Claim
                          </Link>
                          <Link href={`/items/${yourItem.id}`} className="btn btn-secondary btn-sm">
                            View Your Item
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ═══ Search Tab ═══ */}
          {tab === 'search' && (
            <>
              {searchQuery && (
                <div className={styles.searchResultsHeader}>
                  <h2 className="title-lg">
                    Results for &ldquo;{searchQuery}&rdquo;
                  </h2>
                  <span className="body-md text-on-variant">
                    {searchResults.length} item{searchResults.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              )}

              {loading ? (
                <div className={styles.loadingState} style={{ minHeight: '30vh' }}>
                  <div className={styles.spinner} />
                  <p className="body-md text-on-variant">Searching…</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🔎</div>
                  <h3 className="headline-sm">
                    {searchQuery ? 'No results found' : 'Search for items'}
                  </h3>
                  <p className="body-md text-on-variant">
                    {searchQuery
                      ? `Try different keywords or check spelling`
                      : 'Use the search bar to find items across your campus'}
                  </p>
                </div>
              ) : (
                <div className={styles.searchGrid}>
                  {searchResults.map((item) => (
                    <Link key={item.id} href={`/items/${item.id}`} className={styles.searchCard}>
                      <div className={styles.searchCardImage}>
                        {item.images?.[0]
                          ? <img src={item.images[0]} alt="" />
                          : <div className={styles.matchImgPlaceholder}>📦</div>}
                        <span className={`badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'} ${styles.searchBadge}`}>
                          {item.type === 'LOST' ? '🔴 Lost' : '🟢 Found'}
                        </span>
                      </div>
                      <div className={styles.searchCardBody}>
                        <h3 className="title-sm">{item.title}</h3>
                        <p className="body-sm text-on-variant">{item.description.slice(0, 60)}…</p>
                        <div className={styles.searchCardMeta}>
                          <span>📍 {item.location}</span>
                          <span>📅 {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
