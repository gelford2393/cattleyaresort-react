import { useState, useMemo, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import FullCalendar from '@fullcalendar/react';
import { type EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CurrentMonth } from '@/components/CurrentMonth';
import { DateSlotsModal } from './DateSlotsModal';
import { SlotSummary, type DayCounts } from './SlotSummary';
import { ListSlotRow, type SlotEventProps } from './ListSlotRow';
import { useSlotsByMonth } from '@/hooks/useSlots';
import { Box, Stack, Text } from '@/components/ui/primitives';
import '@fullcalendar/common/main.css';

export function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewType, setViewType] = useState('dayGridMonth');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (!dayjs(api.getDate()).isSame(currentDate, 'month')) {
      api.gotoDate(currentDate.startOf('month').toDate());
    }
  }, [currentDate]);

  const { data: slots = [] } = useSlotsByMonth(currentDate.year(), currentDate.month() + 1);

  const gridEvents = useMemo<EventInput[]>(() => {
    const counts = slots.reduce<Record<string, DayCounts>>((acc, slot) => {
      if (!slot.date) return acc;
      if (!acc[slot.date]) acc[slot.date] = { dayP: 0, dayB: 0, nightP: 0, nightB: 0 };
      const isPending = slot.status === 'PENDING';
      if (slot.type === 'NIGHT') {
        if (isPending) acc[slot.date].nightP += 1;
        else acc[slot.date].nightB += 1;
      } else {
        if (isPending) acc[slot.date].dayP += 1;
        else acc[slot.date].dayB += 1;
      }
      return acc;
    }, {});
    return Object.entries(counts).map(([date, c]) => ({
      id: `grid-${date}`,
      title: date,
      start: date,
      allDay: true,
      extendedProps: { ...c, _kind: 'grid' },
    }));
  }, [slots]);

  const listEvents = useMemo<EventInput[]>(() => {
    return slots.map((slot) => {
      const nextDay = dayjs(slot.date).add(1, 'day').format('YYYY-MM-DD');
      const start = slot.type === 'NIGHT' ? `${slot.date}T19:00:00` : `${slot.date}T09:00:00`;
      const end   = slot.type === 'NIGHT' ? `${nextDay}T07:00:00` : `${slot.date}T17:00:00`;
      return {
        id: `list-${slot.id}`,
        title: slot.pool,
        start,
        end,
        allDay: false,
        extendedProps: {
          _kind: 'list',
          pool: slot.pool,
          type: slot.type,
          status: slot.status,
        } satisfies SlotEventProps & { _kind: string },
      };
    });
  }, [slots]);

  const events = viewType === 'listMonth' ? listEvents : gridEvents;

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
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth',
          }}
          events={events}
          eventContent={(arg) => {
            if (arg.view.type === 'listMonth') {
              const p = arg.event.extendedProps as SlotEventProps;
              return <ListSlotRow pool={p.pool} type={p.type} status={p.status} />;
            }
            const c = arg.event.extendedProps as DayCounts;
            return <SlotSummary dayP={c.dayP} dayB={c.dayB} nightP={c.nightP} nightB={c.nightB} />;
          }}
          datesSet={(arg) => {
            setCurrentDate(dayjs(arg.view.currentStart));
            setViewType(arg.view.type);
          }}
          dateClick={(arg) => setSelectedDate(arg.dateStr)}
          eventClick={(arg) => setSelectedDate(arg.event.startStr)}
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
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
