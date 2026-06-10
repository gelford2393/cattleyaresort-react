import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/useAppStore';
import { CurrentMonth } from '@/components/CurrentMonth';
import { useSlotsByMonth } from '@/hooks/useSlots';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Box, Stack, Flex, Text } from '@/components/ui/primitives';

export function PoolSlotPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const pools = useAppStore((s) => s.pools);

  const { data: slots = [], isLoading, isError, error } = useSlotsByMonth(
    currentDate.year(),
    currentDate.month() + 1
  );

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
    <Stack gap="s0">
      <Flex align="center" justify="between" wrap="wrap" gap="s-1">
        <Text as="h1" size="xxl" weight="bold">Slots per Pool</Text>
        <Flex align="center" className="gap-3">
          <CurrentMonth value={currentDate} onChange={setCurrentDate} />
          {isLoading && <Text as="span" size="small" color="muted">Loading...</Text>}
        </Flex>
      </Flex>
      <Flex className="text-xs gap-3 text-muted-foreground">
        <span><span className="inline-block w-3 h-3 rounded bg-warning/40 mr-1"></span>Unpaid (PENDING/PENCIL)</span>
        <span><span className="inline-block w-3 h-3 rounded bg-destructive/30 mr-1"></span>Paid (BOOKED)</span>
      </Flex>
      <Box className="overflow-x-auto">
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
                          status === 'BOOKED' ? 'bg-destructive/20' :
                          status === 'PENDING' || status === 'PENCIL' ? 'bg-warning/20' : ''
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
      </Box>
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}
