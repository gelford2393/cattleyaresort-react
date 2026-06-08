import { useState } from 'react';
import dayjs from 'dayjs';
import { CurrentMonth } from '@/components/CurrentMonth';
import { CalendarMarker } from '@/components/CalendarMarker';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const startOfMonth = currentDate.startOf('month');
  const daysInMonth = currentDate.daysInMonth();
  const startDayOfWeek = startOfMonth.day(); // 0=Sun

  const days: (dayjs.Dayjs | null)[] = [
    ...Array(startDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => startOfMonth.add(i, 'day')),
  ];

  // Pad to complete last row
  while (days.length % 7 !== 0) days.push(null);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <CurrentMonth value={currentDate} onChange={setCurrentDate} />
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {weekDays.map((d) => (
          <div key={d} className="bg-muted text-center text-xs font-semibold py-2">{d}</div>
        ))}
        {days.map((day, i) => (
          <div key={i} className="bg-background p-2 min-h-[80px]">
            {day && (
              <>
                <div className="text-xs font-medium mb-1">{day.date()}</div>
                <CalendarMarker date={day.format('YYYY-MM-DD')} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
