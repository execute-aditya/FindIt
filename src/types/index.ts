import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      campus: string;
    } & DefaultSession['user'];
  }
}

export type ItemType = 'LOST' | 'FOUND';
export type ItemStatus = 'ACTIVE' | 'PENDING_CLAIM' | 'CLAIMED' | 'RESOLVED';
export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Category =
  | 'ELECTRONICS'
  | 'CLOTHING'
  | 'ACCESSORIES'
  | 'BOOKS'
  | 'STATIONERY'
  | 'KEYS'
  | 'WALLET'
  | 'ID_CARD'
  | 'SPORTS'
  | 'OTHER';

export interface ItemUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  department: string | null;
  phone: string | null;
}

export interface Claim {
  id: string;
  itemId: string;
  claimantId: string;
  claimant: ItemUser;
  description: string;
  proofImages: string[];
  status: ClaimStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ItemType;
  status: ItemStatus;
  location: string;
  campus: string;
  date: string;
  brand: string | null;
  color: string | null;
  serialNumber: string | null;
  images: string[];
  tags: string[];
  contactInfo: string | null;
  userId: string;
  user: ItemUser;
  claims?: Claim[];
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  lostItem: Item;
  foundItem: Item;
  score: number;
  reasons: { factor: string; weight: string; icon: string }[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  isReverse?: boolean;
}

export interface MatchStats {
  yourLostItems: number;
  yourFoundItems: number;
  totalFoundOnCampus: number;
  totalLostOnCampus: number;
  matchesFound: number;
}

