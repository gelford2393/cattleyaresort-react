import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import FullCalendar from '@fullcalendar/react';
import { type EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CurrentMonth } from '@/components/CurrentMonth';
import { CalendarMarker } from '@/components/CalendarMarker';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import '@fullcalendar/common/main.css';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const start = currentDate.startOf('month').format('YYYY-MM-DD');
    const end = currentDate.endOf('month').format('YYYY-MM-DD');
    const slotsQuery = query(
      collection(firestore, 'slots'),
      where('date', '>=', start),
      where('date', '<=', end)
    );

    getDocs(slotsQuery).then((snap) => {
      const counts = snap.docs.reduce<Record<string, { day: number; night: number }>>((acc, doc) => {
        const data = doc.data() as { date?: string; type?: string };
        const date = data.date;
        if (!date) return acc;
        const type = data.type || 'DAY';
        if (!acc[date]) acc[date] = { day: 0, night: 0 };
        if (type === 'NIGHT') acc[date].night += 1;
        else acc[date].day += 1;
        return acc;
      }, {});

      setEvents(
        Object.entries(counts).map(([date, count]) => ({
          id: date,
          title: `D:${count.day} N:${count.night}`,
          start: date,
          allDay: true,
          className: count.day + count.night > 0 ? 'bg-secondary text-secondary-foreground' : '',
        }))
      );
    });
  }, [currentDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground">Monthly booking overview with slot counts on each day.</p>
        </div>
        <CurrentMonth value={currentDate} onChange={setCurrentDate} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }}
          events={events}
          datesSet={(arg) => setCurrentDate(dayjs(arg.start))}
          dateClick={(arg) => setSelectedDate(arg.dateStr)}
          eventClick={(arg) => setSelectedDate(arg.event.startStr)}
          height="auto"
          dayMaxEvents={true}
          initialDate={currentDate.format('YYYY-MM-DD')}
        />
      </div>

      {selectedDate && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold mb-4">Details for {dayjs(selectedDate).format('MMMM D, YYYY')}</h2>
          <CalendarMarker date={selectedDate} />
        </div>
      )}
    </div>
  );
}
