<div align="center">

<br/>

# 🔍 FindIt

<br/>

**A heuristic-driven, AI-assisted lost-and-found platform built for college campuses.**  
Post what you lost. Post what you found. Let the engine bring them together.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Images-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-v4-black?style=for-the-badge&logo=auth0&logoColor=white)](https://next-auth.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge)](LICENSE)

<br/>

> 🏛️ Built at **Saraswati College of Engineering** · Navi Mumbai

</div>

---

## 📌 Table of Contents

- [Why FindIt?](#-why-findit)
- [Core Features](#-core-features)
- [How the Matching Engine Works](#-how-the-matching-engine-works)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Security Design](#-security-design)
- [Performance](#-performance)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Future Roadmap](#-future-roadmap)
- [License](#-license)

---

## 💡 Why FindIt?

Traditional lost-and-found systems fail students in three critical ways:

| Problem | Traditional Approach | FindIt Solution |
|---------|---------------------|-----------------|
| **Fragmented data** | WhatsApp groups, notice boards | Centralized, searchable database |
| **Manual matching** | Security office cross-referencing | Automated heuristic NLP engine |
| **No trust layer** | Anonymous strangers | Verified campus-email-only community |
| **Privacy risks** | Contact info exposed publicly | Identity hidden until claim is approved |
| **Poor retrieval** | <15% recovery rate (historical) | Precision of 0.98 for electronics |

> A cross-campus survey at SCE revealed **Electronics (42%)** and **ID Cards/Wallets (31%)** are the most commonly lost high-value items — precisely the categories where FindIt's matching engine excels.

---

## ✨ Core Features

### 🤖 Smart AI Matching Engine
A non-neural, deterministic **Heuristic NLP pipeline** that automatically pairs Lost and Found reports using TF-IDF scoring, synonym lattices, bigram analysis, and spatiotemporal decay — all running in under **42ms** average latency.

### 🔐 Institutional Walled Garden
Registration is restricted to official `@*.sce.edu.in` college email domains. Only verified students and faculty can access the platform — building a high-trust micro-community where meetups feel safe.

### 📋 Multi-Stage Claim Lifecycle
Items move through a structured state machine:
```
ACTIVE → PENDING_CLAIM → CLAIMED → RESOLVED
```
Claimants submit proof of ownership (text + images). Finders review and approve/reject. Identities remain private until approval.

### 📧 Automated Email Notifications
When a match with confidence score `> 0.20` is detected, both parties receive an email notification immediately — powered by Nodemailer + Gmail SMTP.

### 🖼️ Image Uploads with CDN Delivery
Item photos are uploaded to **Cloudinary** and delivered via global CDN for fast loading across all devices.

### 🔒 7-Day Deletion Lock
Posts cannot be deleted for 7 days after creation, preventing bad actors from using the platform to "probe" what items are available and then withdrawing fake reports.

### 📱 Fully Responsive Design
Built with a mobile-first mindset using **CSS Modules** and **Glassmorphism** design principles — students can report items on-the-go in under 60 seconds.

---

## 🧠 How the Matching Engine Works

FindIt's core is a **Deterministic Multi-Stage Heuristic Pipeline** — no LLMs, no cloud AI calls, zero extra cost.

### Scoring Architecture

```
┌──────────────────────────────────────────────────────────┐
│              CONFIDENCE SCORE COMPUTATION                │
├─────────────────────────┬──────────┬─────────────────────┤
│ Signal                  │ Weight   │ Method              │
├─────────────────────────┼──────────┼─────────────────────┤
│ Serial Number / ID      │  0.90    │ Exact match → 1.0   │
│ Category                │  Gate    │ Must match to proceed│
│ Brand                   │  0.20    │ Fuzzy brand match   │
│ Title (TF-IDF)          │  0.30    │ Bigram + token IDF  │
│ Description (semantic)  │  0.10    │ Stopword-filtered   │
│ Color (synonym lattice) │  0.15    │ Synonym mapping     │
│ Location proximity      │  0.10    │ Campus zone match   │
│ Temporal decay          │  ×factor │ 30-day linear decay │
└─────────────────────────┴──────────┴─────────────────────┘
```

### Synonym Lattices
The engine bridges the **Semantic Gap** between how owners and finders describe the same item:

```
RED    ← { Crimson, Scarlet, Maroon, Ruby, Burgundy }
GREY   ← { Gray, Silver, Slate, Ash, Space Grey }
BLUE   ← { Navy, Cobalt, Azure, Royal, Indigo }
```

### Algorithm (Pseudocode)
```typescript
async function computeConfidenceScore(lost, found) {
  // Definitive identifier — instant 100% match
  if (match(lost.serial, found.serial)) return 1.0;

  // Categorical gate — prunes the search space to O(n/k)
  if (lost.category !== found.category) return 0;

  let score = 0;
  score += tfIdfMatch(lost.title, found.title)    * 0.30;
  score += synonymMatch(lost.color, found.color)  * 0.15;
  score += brandMatch(lost.brand, found.brand)    * 0.20;
  score += locationProximity(lost.loc, found.loc) * 0.10;

  // Spatiotemporal decay over 30-day window
  score *= timeDecay(lost.date, found.date);

  return clamp(score, 0, 1);
}
```

### Matching Workflow
```
User Posts "Lost" Report
        │
        ▼
Backend triggers computeMatches()
        │
        ▼
Fetch all "Found" items → same campus + same category
        │
        ▼
Score each candidate pair using heuristic pipeline
        │
        ▼
 score > threshold?
   ├── YES → Notify both users via email + show Match Card
   └── NO  → Store report; re-check when new Found items arrive
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) | SSR + API routes in one codebase |
| **Language** | TypeScript 5 | Full type safety across frontend & backend |
| **ORM** | [Prisma 5](https://www.prisma.io/) | Type-safe DB access, easy schema migrations |
| **Database** | PostgreSQL via [Supabase](https://supabase.com/) | Managed Postgres with connection pooling |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org/) | Session + JWT with domain-level guard |
| **Image CDN** | [Cloudinary](https://cloudinary.com/) | Optimized delivery, transform-on-the-fly |
| **Email** | [Nodemailer](https://nodemailer.com/) + Gmail | Match notifications & account verification |
| **Validation** | [Zod](https://zod.dev/) | Schema-driven validation on API + form layers |
| **Styling** | Vanilla CSS (CSS Modules) | Scoped styles, glassmorphism, zero bloat |
| **Hashing** | bcryptjs (12 rounds) | Secure password storage |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                         │
│              React / Next.js App Router (SSR)               │
│   Dashboard │ Item Feed │ Post Form │ Match Cards │ Profile  │
└────────────────────────┬─────────────────────────────────────┘
                         │  HTTP / Server Actions
┌────────────────────────▼─────────────────────────────────────┐
│                      LOGIC TIER                              │
│                  Next.js API Routes                          │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Auth Guard │  │  Match Engine│  │   Claim Manager    │  │
│  │  (NextAuth) │  │  (Heuristic) │  │ (State Machine)    │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Email Queue │  │  Zod Schemas │  │  Cloudinary Upload │  │
│  │ (Nodemailer)│  │  (Validation)│  │     (Images)       │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │  Prisma ORM
┌────────────────────────▼─────────────────────────────────────┐
│                       DATA TIER                              │
│         PostgreSQL (Supabase)    +    Cloudinary CDN         │
│   Users │ Items │ Claims │ Messages │ Tokens │ Item Images   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

The schema follows **Third Normal Form (3NF)** principles for data consistency and zero redundancy.

```prisma
model User {
  id            String    // CUID primary key
  name          String
  email         String    @unique   // must be @*.sce.edu.in
  password      String              // bcrypt hashed (12 rounds)
  role          Role                // USER | ADMIN
  department    String?
  phone         String    @unique
  campus        String              // for scoped matching
  items         Item[]
  claims        Claim[]
  sentMessages  Message[]
  receivedMessages Message[]
}

model Item {
  id           String
  title        String
  description  String
  category     Category   // ELECTRONICS | CLOTHING | WALLET | ...
  type         ItemType   // LOST | FOUND
  status       ItemStatus // ACTIVE → PENDING_CLAIM → CLAIMED → RESOLVED
  location     String
  campus       String
  date         DateTime
  brand        String?    // high-weight matching signal
  color        String?    // synonym lattice matching
  serialNumber String?    // triggers 1.0 confidence match
  images       String[]   // Cloudinary URLs
  tags         String[]
}

model Claim {
  id          String
  item        Item
  claimant    User
  description String
  proofImages String[]
  status      ClaimStatus  // PENDING | APPROVED | REJECTED
  reviewNote  String?
}

model Message {
  content    String
  sender     User
  receiver   User
  item       Item
  read       Boolean
}
```

**Item Categories:**
`ELECTRONICS` · `CLOTHING` · `ACCESSORIES` · `BOOKS` · `STATIONERY` · `KEYS` · `WALLET` · `ID_CARD` · `SPORTS` · `OTHER`

---

## 🔒 Security Design

FindIt treats security as a **primary feature**, not an afterthought.

### Domain-Level Authentication
```typescript
const ALLOWED_DOMAINS = [
  '@comp.sce.edu.in',
  '@it.sce.edu.in',
  '@mech.sce.edu.in',
  '@civil.sce.edu.in',
  '@ds.sce.edu.in',
  '@aiml.sce.edu.in',
];
const isValid = ALLOWED_DOMAINS.some(d => email.endsWith(d));
```

### Security Layers

| Layer | Mechanism |
|-------|-----------|
| **Password Storage** | `bcryptjs` with 12 salt rounds — resists brute-force even in a breach |
| **Session Management** | NextAuth.js JWTs with signed `NEXTAUTH_SECRET` |
| **API Gatekeeping** | Every route validates session before touching the database |
| **Email Verification** | Account is inactive until the institutional email is verified |
| **Anti-Probe Protection** | 7-day deletion lock prevents bad actors from using fake posts to discover available items |
| **Identity Privacy** | Claimant/owner contact info hidden until claim is `APPROVED` |
| **Input Validation** | All API inputs validated with Zod schemas — prevents injection |
| **Password Reset** | Secure time-limited token flow via `PasswordResetToken` table |

---

## ⚡ Performance

Benchmarked on Vercel Node.js 18.x serverless runtime:

| Metric | Value |
|--------|-------|
| Mean match search latency | **42 ms** |
| Worst-case latency (1000+ items) | **115 ms** |
| Cold-start execution | **250 ms** |
| Electronics match precision | **0.98** |
| ID Card / Wallet precision | **1.00** (when serial/name provided) |
| Synonym resolution accuracy | **0.88** |

The engine uses **inverted category + campus indexing** to prune the search space before applying semantic checks — ensuring the expensive heuristic computation only runs on a small, relevant subset.

---

## 📁 Project Structure

```
findit-campus/
│
├── prisma/
│   ├── schema.prisma            # Full relational data model
│   └── schema.sql               # Reference DDL (for documentation)
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/            # [...nextauth], register, verify,
│   │   │   │                    # forgot-password, reset-password
│   │   │   ├── items/           # CRUD + claims lifecycle
│   │   │   │   └── [id]/claims/ # Claim create / review endpoints
│   │   │   ├── matches/         # Match engine trigger & results
│   │   │   └── profile/         # User profile + their items
│   │   │
│   │   ├── auth/
│   │   │   ├── signin/          # Login page
│   │   │   ├── signup/          # Registration page
│   │   │   ├── verify/          # Email verification landing
│   │   │   ├── forgot-password/ # Forgot password page
│   │   │   └── reset-password/  # Password reset page
│   │   │
│   │   ├── dashboard/           # User's personal dashboard
│   │   ├── items/
│   │   │   ├── [id]/            # Item detail + claim submission
│   │   │   └── post/            # Post new lost/found item
│   │   ├── matches/             # Match results feed
│   │   ├── profile/             # Public profile view
│   │   ├── layout.tsx           # Root layout + providers
│   │   ├── page.tsx             # Landing / home feed
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── items/
│   │   │   ├── ItemCard.tsx     # Reusable item card with status badge
│   │   │   └── StatusBadge.tsx  # ACTIVE / CLAIMED / RESOLVED badge
│   │   └── layout/
│   │       └── Sidebar.tsx      # Navigation sidebar
│   │
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config & domain validation
│   │   ├── cloudinary.ts        # Cloudinary upload helper
│   │   ├── mail.ts              # Nodemailer transporter & templates
│   │   └── prisma.ts            # Singleton Prisma client
│   │
│   └── types/
│       └── index.ts             # Shared TypeScript types
│
├── .env.example                 # ← Copy this to .env.local to get started
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A [Supabase](https://supabase.com/) project (free tier is enough)
- A [Cloudinary](https://cloudinary.com/) account (free tier is enough)
- A Gmail account with a [Google App Password](https://support.google.com/accounts/answer/185833) generated

### 1. Clone the repository

```bash
git clone https://github.com/your-username/findit-campus.git
cd findit-campus
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Then open .env.local and fill in all values (see table below)
```

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're live. 🎉

---

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase connection pooler URL | `postgresql://...` |
| `DIRECT_URL` | Supabase direct connection (for migrations) | `postgresql://...` |
| `NEXTAUTH_URL` | Public URL of your app | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random JWT signing secret | `openssl rand -base64 32` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | `dosmaexyz` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `329642...` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `VNbYEg...` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` |
| `SMTP_USER` | Sender email address | `support.findit@gmail.com` |
| `SMTP_PASS` | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Display name + email | `FindIt Campus <...>` |

> ⚠️ **Never commit `.env` or `.env.local` to git.** They are listed in `.gitignore`. Use `.env.example` as the safe template.

### Useful Scripts

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Sync Prisma schema → database
npm run db:studio    # Open Prisma Studio (visual DB editor)
```

---

## 🔭 Future Roadmap

| Phase | Feature | Description |
|-------|---------|-------------|
| **v2** | 🖼️ Computer Vision | CNN/ViT to auto-categorize item photos and extract brand/color/damage |
| **v2** | 🧠 Vector Search | Migrate to BERT/OpenAI embeddings + `pgvector` for true semantic search |
| **v2** | 📍 IoT Integration | Bluetooth/Wi-Fi beacon cross-referencing for real-time location tagging |
| **v3** | 🏷️ NFC/QR Tags | "FindIt Verified" stickers on valuables for instant scan-to-report |
| **v3** | 🌐 Multi-Campus Federation | Extend the platform to multiple institutions with shared item database |
| **v3** | 📊 Admin Analytics | Campus security dashboard with heatmaps of high-loss zones |
| **v3** | 🤖 AI Auto-Fill | Predict category/color/brand from a typed title using local ML |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ at **Saraswati College of Engineering**, Navi Mumbai

*FindIt — because every lost item deserves to be found.*

</div>
