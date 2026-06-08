import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props { value: dayjs.Dayjs; onChange: (d: dayjs.Dayjs) => void; }

export function CurrentMonth({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onChange(value.subtract(1, 'month'))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-base font-semibold w-36 text-center">{value.format('MMMM YYYY')}</span>
      <Button variant="outline" size="icon" onClick={() => onChange(value.add(1, 'month'))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
