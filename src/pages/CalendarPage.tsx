import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import FullCalendar from '@fullcalendar/react';
import { type EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CurrentMonth } from '@/components/CurrentMonth';
import { DateSlotsModal } from '@/components/DateSlotsModal';
import { useSlotsByMonth } from '@/hooks/useSlots';
import { Box, Stack, Text } from '@/components/ui/primitives';
import '@fullcalendar/common/main.css';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: slots = [] } = useSlotsByMonth(currentDate.year(), currentDate.month() + 1);

  const events = useMemo<EventInput[]>(() => {
    const counts = slots.reduce<Record<string, { day: number; night: number }>>((acc, slot) => {
      if (!slot.date) return acc;
      if (!acc[slot.date]) acc[slot.date] = { day: 0, night: 0 };
      if (slot.type === 'NIGHT') acc[slot.date].night += 1;
      else acc[slot.date].day += 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([date, count]) => ({
      id: date,
      title: `D:${count.day} N:${count.night}`,
      start: date,
      allDay: true,
      className: count.day + count.night > 0 ? 'bg-secondary text-secondary-foreground' : '',
    }));
  }, [slots]);

  return (
    <Stack gap="s0">
      <Stack gap="s0" className="md:flex-row md:items-center md:justify-between">
        <Box>
          <Text as="h1" size="xxl" weight="bold">Calendar</Text>
          <Text size="small" color="muted">Monthly booking overview with slot counts on each day.</Text>
        </Box>
        <CurrentMonth value={currentDate} onChange={setCurrentDate} />
      </Stack>

      <Box className="rounded-lg border bg-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth',
          }}
          events={events}
          datesSet={(arg) => setCurrentDate(dayjs(arg.start))}
          dateClick={(arg) => setSelectedDate(arg.dateStr)}
          eventClick={(arg) => setSelectedDate(arg.event.startStr)}
          height="auto"
          dayMaxEvents={true}
          initialDate={currentDate.format('YYYY-MM-DD')}
        />
      </Box>

      <DateSlotsModal
        open={!!selectedDate}
        date={selectedDate ?? ''}
        onClose={() => setSelectedDate(null)}
      />
    </Stack>
  );
}
