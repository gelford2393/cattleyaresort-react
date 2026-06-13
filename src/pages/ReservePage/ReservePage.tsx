import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Stack, Text } from '@/components/ui/primitives';
import { ReserveForm } from '@/components/ReserveForm';
import { useSlotsByDate } from '@/hooks/useSlots';

const today = format(new Date(), 'yyyy-MM-dd');

export function ReservePage() {
  const navigate = useNavigate();
  const [reserveDate, setReserveDate] = useState(today);
  const { data: slots = [] } = useSlotsByDate(reserveDate);

  const takenSlots = slots
    .filter((s) => s.status !== 'CANCELLED')
    .map((s) => ({ pool: s.pool, type: s.type }));

  return (
    <Stack gap="s1">
      <Text as="h1" size="xxl" weight="bold">Reserve</Text>
      <ReserveForm
        defaultDate={today}
        disablePastDates
        takenSlots={takenSlots}
        onDateChange={setReserveDate}
        onSuccess={(id) => navigate(`/booking/${id}`)}
      />
    </Stack>
  );
}
