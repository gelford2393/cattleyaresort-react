import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { CurrentMonth } from '@/components/CurrentMonth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface SlotRecord { pool: string; type: string; date: string; status: string; bookingNo: string; }

export function PoolSlotPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [slots, setSlots] = useState<SlotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pools = useAppStore((s) => s.pools);

  useEffect(() => {
    let cancelled = false;
    const fetchSlots = async () => {
      setLoading(true);
      setSlots([]);
      setError('');
      const startDate = currentDate.startOf('month').format('YYYY-MM-DD');
      const endDate = currentDate.endOf('month').format('YYYY-MM-DD');
      try {
        const snap = await getDocs(
          query(collection(firestore, 'slots'), where('date', '>=', startDate), where('date', '<=', endDate))
        );
        if (!cancelled) setSlots(snap.docs.map((d) => d.data() as SlotRecord));
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, [currentDate]);

  const slotMap = useMemo(() => {
    const m = new Map<string, string>();
    slots.forEach((s) => m.set(`${s.pool}|${s.type}|${s.date}`, s.status));
    return m;
  }, [slots]);

  const getSlotStatus = (poolName: string, type: 'DAY' | 'NIGHT', date: string) =>
    slotMap.get(`${poolName}|${type}|${date}`) ?? null;

  const daysInMonth = currentDate.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    currentDate.startOf('month').add(i, 'day').format('YYYY-MM-DD')
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Slots per Pool</h1>
        <div className="flex items-center gap-3">
          <CurrentMonth value={currentDate} onChange={setCurrentDate} />
          {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
        </div>
      </div>
      <div className="text-xs flex gap-3 text-muted-foreground">
        <span><span className="inline-block w-3 h-3 rounded bg-yellow-200 mr-1"></span>Unpaid (PENDING/PENCIL)</span>
        <span><span className="inline-block w-3 h-3 rounded bg-red-200 mr-1"></span>Paid (BOOKED)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-muted sticky left-0">Pool</th>
              <th className="border px-2 py-1 bg-muted">T</th>
              {days.map((d) => (
                <th key={d} className="border px-1 py-1 bg-muted min-w-[28px]">
                  {dayjs(d).date()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) =>
              (['DAY', 'NIGHT'] as const).map((type, ti) => (
                <tr key={`${pool.pool}-${type}`}>
                  {ti === 0 && (
                    <td rowSpan={2} className="border px-2 py-1 sticky left-0 bg-background font-medium">{pool.pool}</td>
                  )}
                  <td className="border px-2 py-1 text-center text-muted-foreground">{type[0]}</td>
                  {days.map((d) => {
                    const status = getSlotStatus(pool.pool, type, d);
                    return (
                      <td
                        key={d}
                        className={cn(
                          'border px-1 py-1 text-center',
                          status === 'BOOKED' ? 'bg-red-100' :
                          status === 'PENDING' || status === 'PENCIL' ? 'bg-yellow-100' : ''
                        )}
                      >
                        {status ? '●' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
