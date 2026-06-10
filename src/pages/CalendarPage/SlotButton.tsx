import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SlotState =
  | { kind: 'empty' }
  | { kind: 'pending'; bookingDocId: string }
  | { kind: 'booked'; bookingDocId: string };

interface SlotButtonProps {
  slotState: SlotState;
  onAdd: () => void;
  onOpen: (bookingDocId: string) => void;
}

function assertNever(x: never): never {
  throw new Error(`Unhandled SlotState: ${JSON.stringify(x)}`);
}

export function SlotButton({ slotState, onAdd, onOpen }: SlotButtonProps) {
  if (slotState.kind === 'empty') {
    return (
      <Button size="sm" className="w-20 bg-success hover:bg-success/90 text-success-foreground" onClick={onAdd}>
        ADD
      </Button>
    );
  }
  if (slotState.kind === 'pending') {
    return (
      <Button size="sm" className="w-20 bg-warning hover:bg-warning/90 text-warning-foreground" onClick={() => onOpen(slotState.bookingDocId)}>
        <Pencil className="h-4 w-4" />
      </Button>
    );
  }
  if (slotState.kind === 'booked') {
    return (
      <Button size="sm" className="w-20 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => onOpen(slotState.bookingDocId)}>
        BOOKED
      </Button>
    );
  }
  return assertNever(slotState);
}
