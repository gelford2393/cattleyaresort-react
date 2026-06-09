import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Flex, Text } from '@/components/ui/primitives';

interface Props { value: dayjs.Dayjs; onChange: (d: dayjs.Dayjs) => void; }

export function CurrentMonth({ value, onChange }: Props) {
  return (
    <Flex gap="s-1" align="center">
      <Button variant="outline" size="icon" onClick={() => onChange(value.subtract(1, 'month'))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Text as="span" weight="semibold" className="w-36 text-center">{value.format('MMMM YYYY')}</Text>
      <Button variant="outline" size="icon" onClick={() => onChange(value.add(1, 'month'))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </Flex>
  );
}
