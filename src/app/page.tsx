import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'FindIt Campus | The Digital Curator for Lost & Found',
};

const features = [
  { icon: '🤖', title: 'AI-Powered Matching', desc: 'Our neural engine analyzes images and descriptions in real-time to connect owners with their belongings.' },
  { icon: '🗺️', title: 'Campus Map Integration', desc: 'Visualize lost and found items on an interactive campus map to pinpoint exactly where they were seen.' },
  { icon: '🔔', title: 'Instant Notifications', desc: 'Get notified the moment a match is found — no more refreshing feeds or checking notice boards.' },
  { icon: '🔒', title: 'Verified Community', desc: 'Every user is authenticated with their campus credentials ensuring a trusted and safe community.' },
  { icon: '📸', title: 'Photo Evidence', desc: 'Upload multiple photos to give the best chance of identification and reduce false claims.' },
  { icon: '💬', title: 'Direct Messaging', desc: 'Contact the finder or reporter directly through our secure in-app messaging system.' },
];

const stats = [
  { value: '94%', label: 'Recovery Rate' },
  { value: '2.4h', label: 'Avg. Match Time' },
  { value: '10K+', label: 'Items Recovered' },
  { value: '50+', label: 'Campuses' },
];

const testimonials = [
  { quote: 'FindIt has completely transformed our campus lost-and-found. It\'s not just an app — it\'s a curated safety net for our student body.', name: 'Dr. Priya Sharma', role: 'Dean of Students, MIT Pune' },
  { quote: 'I lost my laptop in the library on a Monday. By Tuesday afternoon, FindIt had already matched it to a found post. Unbelievable!', name: 'Aditya Rathore', role: 'Engineering Student' },
  { quote: 'The AI matching is genuinely remarkable. It found my blue Moleskine notebook just from the description and a colour photo.', name: 'Meera Nair', role: 'Design Student' },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Navbar */}
      <header className={`glass ${styles.navbar}`}>
        <div className={`container ${styles.navInner}`}>
          <div className={styles.navLogo}>
            <div className={styles.logoMark}>F</div>
            <span className={styles.logoText}>FindIt</span>
          </div>
          <nav className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#how" className={styles.navLink}>How It Works</a>
            <a href="#stats" className={styles.navLink}>Stats</a>
          </nav>
          <div className={styles.navActions}>
            <Link href="/auth/signin" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link href="/auth/signup" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroBadge}>
            <span>✨</span> The Digital Curator for Campus Lost &amp; Found
          </div>
          <h1 className={`display-lg ${styles.heroTitle}`}>
            Lost items found through<br />
            <span className={styles.heroAccent}>intelligence</span> &amp; trust.
          </h1>
          <p className={`body-lg ${styles.heroDesc}`}>
            FindIt is a smart campus platform that uses AI-powered matching to reunite students with their lost belongings — faster, smarter, and with zero hassle.
          </p>
          <div className={styles.heroActions}>
            <Link href="/auth/signup" className="btn btn-primary btn-lg">
              🚀 Start for Free
            </Link>
            <a href="#how" className="btn btn-secondary btn-lg">
              See How It Works
            </a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardHeader}>
              <span className="badge badge-found">🟢 Found</span>
              <span className={styles.heroCardTime}>2h ago</span>
            </div>
            <div className={styles.heroCardTitle}>Blue Moleskine Notebook</div>
            <div className={styles.heroCardMeta}>📍 Central Library, 3rd Floor</div>
            <div className={styles.matchScore}>
              <div className={styles.matchLabel}>🤖 AI Match Score</div>
              <div className={styles.matchBar}><div className={styles.matchFill} style={{ width: '94%' }} /></div>
              <div className={styles.matchPercent}>94%</div>
            </div>
          </div>
          <div className={styles.heroFloatCard}>
            <span>🎉</span>
            <span>Match found in <strong>2.1 hours</strong></span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div className={`display-sm ${styles.statValue}`}>{s.value}</div>
                <div className={`label-lg text-on-variant`}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={styles.howSection}>
        <div className="container">
          <div className={styles.sectionLabel}>Simple Process</div>
          <h2 className={`display-sm ${styles.sectionTitle}`}>From lost to found in 3 steps</h2>
          <div className={styles.steps}>
            {[
              { num: '01', title: 'Report It', desc: 'Post your lost item with photos, description, and location on campus.' },
              { num: '02', title: 'AI Matches', desc: 'Our matching engine scans all "Found" reports and surfaces the best matches.' },
              { num: '03', title: 'Reunite', desc: 'Get notified, contact the finder, and collect your belonging safely.' },
            ].map((step) => (
              <div key={step.num} className={styles.step}>
                <div className={styles.stepNum}>{step.num}</div>
                <h3 className="headline-sm">{step.title}</h3>
                <p className="body-md text-on-variant">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.featuresSection}>
        <div className="container">
          <div className={styles.sectionLabel}>Why FindIt</div>
          <h2 className={`display-sm ${styles.sectionTitle}`}>Everything you need to find what matters</h2>
          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className={`card card-body ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className="headline-sm">{f.title}</h3>
                <p className="body-md text-on-variant">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <div className="container">
          <div className={styles.sectionLabel}>Trusted by the campus community</div>
          <h2 className={`display-sm ${styles.sectionTitle}`}>What students &amp; staff say</h2>
          <div className={styles.testimonialGrid}>
            {testimonials.map((t) => (
              <div key={t.name} className={`card card-body ${styles.testimonialCard}`}>
                <p className={`body-lg ${styles.quote}`}>"{t.quote}"</p>
                <div className={styles.author}>
                  <div className={styles.authorAvatar}>{t.name[0]}</div>
                  <div>
                    <div className="title-sm">{t.name}</div>
                    <div className="label-sm text-on-variant">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2 className={`display-sm ${styles.ctaTitle}`}>Ready to recover what's yours?</h2>
            <p className="body-lg" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Join thousands of students already using FindIt on their campus.
            </p>
            <Link href="/auth/signup" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)' }}>
              🎓 Join Your Campus
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div>
            <div className={styles.footerLogo}>FindIt Campus</div>
            <p className="body-sm text-on-variant">The Digital Curator for campus belongings.</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <div className={styles.footerLinkTitle}>Product</div>
              <a href="#features">Features</a>
              <a href="#how">How It Works</a>
              <Link href="/dashboard">Dashboard</Link>
            </div>
            <div>
              <div className={styles.footerLinkTitle}>Legal</div>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className={`container ${styles.footerBottom}`}>
          © 2024 FindIt Campus. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
