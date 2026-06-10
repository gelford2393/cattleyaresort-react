export interface SlotEventProps { pool: string; type: string; status: string; }

function getTypeLabel(type: string): string {
  if (type === 'DAY') return 'Day';
  if (type === 'NIGHT') return 'Night';
  if (type === 'STRAIGHT') return 'Straight';
  return type;
}

export function ListSlotRow({ pool, type, status }: SlotEventProps) {
  const isPending = status === 'PENDING';
  const statusColor = isPending ? '#ca8a04' : '#dc2626';
  const statusLabel = isPending ? 'Pending' : 'Booked';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', flexWrap: 'wrap', width: '100%' }}>
      <span style={{ fontWeight: 700 }}>{pool}</span>
      <span style={{ opacity: 0.35 }}>·</span>
      <span style={{ opacity: 0.85 }}>{getTypeLabel(type)}</span>
      <span style={{ opacity: 0.35 }}>·</span>
      <span style={{ fontWeight: 600, color: statusColor }}>{statusLabel}</span>
    </div>
  );
}
