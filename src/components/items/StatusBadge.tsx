import { ItemType, ItemStatus } from '@/types';

interface Props {
  type: ItemType;
  status: ItemStatus;
}

export default function StatusBadge({ type, status }: Props) {
  if (status === 'CLAIMED') {
    return <span className="badge badge-claimed">✅ Claimed</span>;
  }
  if (status === 'RESOLVED') {
    return <span className="badge badge-claimed">✔ Resolved</span>;
  }
  if (status === 'PENDING_CLAIM') {
    return <span className="badge badge-pending">⏳ Claim Pending</span>;
  }
  if (type === 'LOST') {
    return <span className="badge badge-lost">🔴 Lost</span>;
  }
  return <span className="badge badge-found">🟢 Found</span>;
}
