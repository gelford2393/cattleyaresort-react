import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/useAppStore';
import { useSlotsByDate } from '@/hooks/useSlots';
import { ReserveForm } from '@/components/ReserveForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Slot } from '@/lib/queries';

// ── Types ──────────────────────────────────────────────────────────────────────

type CalendarModalView =
  | { view: 'table' }
  | { view: 'reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' }
  | { view: 'booking'; bookingDocId: string };

type CalendarModalAction =
  | { type: 'open_reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' }
  | { type: 'open_booking'; bookingDocId: string }
  | { type: 'back_to_table' };

function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}

function reducer(_state: CalendarModalView, action: CalendarModalAction): CalendarModalView {
  switch (action.type) {
    case 'open_reserve':
      return { view: 'reserve', pool: action.pool, date: action.date, slotType: action.slotType };
    case 'open_booking':
      return { view: 'booking', bookingDocId: action.bookingDocId };
    case 'back_to_table':
      return { view: 'table' };
    default:
      return assertNever(action);
  }
}

// ── Slot state helpers ─────────────────────────────────────────────────────────

type SlotState =
  | { kind: 'empty' }
  | { kind: 'pending'; bookingDocId: string }
  | { kind: 'booked'; bookingDocId: string };

function resolveSlotState(slots: Slot[], pool: string, slotType: 'DAY' | 'NIGHT'): SlotState {
  const slot = slots.find((s) => s.pool === pool && s.type === slotType);
  if (!slot) return { kind: 'empty' };
  if (slot.status === 'BOOKED') return { kind: 'booked', bookingDocId: slot.bookingDocId ?? '' };
  return { kind: 'pending', bookingDocId: slot.bookingDocId ?? '' };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DateSlotsModalProps {
  open: boolean;
  date: string;
  onClose: () => void;
}

export function DateSlotsModal({ open, date, onClose }: DateSlotsModalProps) {
  const navigate = useNavigate();
  const pools = useAppStore((s) => s.pools);
  const { data: slots = [] } = useSlotsByDate(date);
  const [state, dispatch] = useReducer(reducer, { view: 'table' });

  const handleClose = () => {
    dispatch({ type: 'back_to_table' });
    onClose();
  };

  const handleAddClick = (pool: string, slotType: 'DAY' | 'NIGHT') => {
    dispatch({ type: 'open_reserve', pool, date, slotType });
  };

  const handleBookingClick = (bookingDocId: string) => {
    if (!bookingDocId) return;
    navigate(`/booking/${bookingDocId}`, { state: { modal: true } });
  };

  const handleReserveSuccess = () => {
    dispatch({ type: 'back_to_table' });
  };

  return (
    <>
      {/* Main date slots dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dayjs(date).format('ddd, MMM DD YYYY')}</DialogTitle>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool</TableHead>
                <TableHead className="text-center">Day</TableHead>
                <TableHead className="text-center">Night</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.map((pool) => {
                const dayState = resolveSlotState(slots, pool.pool, 'DAY');
                const nightState = resolveSlotState(slots, pool.pool, 'NIGHT');
                return (
                  <TableRow key={pool.pool}>
                    <TableCell className="font-medium">{pool.pool}</TableCell>
                    <TableCell className="text-center">
                      <SlotButton
                        slotState={dayState}
                        onAdd={() => handleAddClick(pool.pool, 'DAY')}
                        onOpen={(id) => handleBookingClick(id)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <SlotButton
                        slotState={nightState}
                        onAdd={() => handleAddClick(pool.pool, 'NIGHT')}
                        onOpen={(id) => handleBookingClick(id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Nested ReserveForm dialog */}
      {state.view === 'reserve' && (
        <Dialog open onOpenChange={() => dispatch({ type: 'back_to_table' })}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                New Reservation — {state.pool} · {state.slotType} · {state.date}
              </DialogTitle>
            </DialogHeader>
            <ReserveForm
              defaultPool={state.pool}
              defaultDate={state.date}
              defaultSlotType={state.slotType}
              onSuccess={handleReserveSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ── SlotButton ────────────────────────────────────────────────────────────────

interface SlotButtonProps {
  slotState: SlotState;
  onAdd: () => void;
  onOpen: (bookingDocId: string) => void;
}

function SlotButton({ slotState, onAdd, onOpen }: SlotButtonProps) {
  if (slotState.kind === 'empty') {
    return (
      <Button
        size="sm"
        className="w-20 bg-success hover:bg-success/90 text-success-foreground"
        onClick={onAdd}
      >
        ADD
      </Button>
    );
  }
  if (slotState.kind === 'pending') {
    return (
      <Button
        size="sm"
        className="w-20 bg-warning hover:bg-warning/90 text-warning-foreground"
        onClick={() => onOpen(slotState.bookingDocId)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    );
  }
  if (slotState.kind === 'booked') {
    return (
      <Button
        size="sm"
        className="w-20 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        onClick={() => onOpen(slotState.bookingDocId)}
      >
        BOOKED
      </Button>
    );
  }
  return assertNever(slotState);
}
