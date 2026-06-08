import { useState } from 'react';
import dayjs from 'dayjs';
import { Calendar } from '@/components/ui/calendar';
import { CurrentMonth } from '@/components/CurrentMonth';
import { CalendarMarker } from '@/components/CalendarMarker';

export function CalendarViewPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleMonthChange = (d: dayjs.Dayjs) => {
    setCurrentDate(d);
    setSelectedDate(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Calendar View</h1>
        <CurrentMonth value={currentDate} onChange={handleMonthChange} />
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={currentDate.toDate()}
          onMonthChange={(d) => setCurrentDate(dayjs(d))}
          className="rounded-md border"
        />
        {selectedDate && (
          <div className="flex-1">
            <h2 className="text-sm font-semibold mb-2">{dayjs(selectedDate).format('MMMM D, YYYY')}</h2>
            <CalendarMarker date={dayjs(selectedDate).format('YYYY-MM-DD')} />
          </div>
        )}
      </div>
    </div>
  );
}
