export interface DayCounts { dayP: number; dayB: number; nightP: number; nightB: number; }

export function SlotSummary({ dayP, dayB, nightP, nightB }: DayCounts) {
  return (
    <div style={{ fontSize: '0.7rem', lineHeight: 1.5, padding: '1px 4px', width: '100%', background: 'transparent', color: 'var(--foreground)' }}>
      {(nightP > 0 || nightB > 0) && (
        <div>
          <span style={{ opacity: 0.65 }}>Night: </span>
          {nightP > 0 && <span style={{ color: '#ca8a04', fontWeight: 600 }}>{nightP}P </span>}
          {nightB > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>{nightB}B</span>}
        </div>
      )}
      {(dayP > 0 || dayB > 0) && (
        <div>
          <span style={{ opacity: 0.65 }}>Day: </span>
          {dayP > 0 && <span style={{ color: '#ca8a04', fontWeight: 600 }}>{dayP}P </span>}
          {dayB > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>{dayB}B</span>}
        </div>
      )}
    </div>
  );
}
