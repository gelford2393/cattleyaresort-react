import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/useAppStore';
import { useSlotsByDate } from '@/hooks/useSlots';
import { ReserveForm } from '@/components/ReserveForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Slot } from '@/lib/queries';
import { SlotButton, type SlotState } from './SlotButton';

// ── Types ──────────────────────────────────────────────────────────────────────

type CalendarModalView =
  | { view: 'table' }
  | { view: 'reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' };

type CalendarModalAction =
  | { type: 'open_reserve'; pool: string; date: string; slotType: 'DAY' | 'NIGHT' }
  | { type: 'back_to_table' };

function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}

function reducer(_state: CalendarModalView, action: CalendarModalAction): CalendarModalView {
  switch (action.type) {
    case 'open_reserve':
      return { view: 'reserve', pool: action.pool, date: action.date, slotType: action.slotType };
    case 'back_to_table':
      return { view: 'table' };
    default:
      return assertNever(action);
  }
}

// ── Slot state helpers ─────────────────────────────────────────────────────────

function resolveSlotState(slots: Slot[], pool: string, slotType: 'DAY' | 'NIGHT'): SlotState {
  const slot = slots.find((s) => s.pool === pool && s.type === slotType && s.status !== 'CANCELLED');
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
  const [showDiscard, setShowDiscard] = useState(false);
  const [bookingMode, setBookingMode] = useState<'single' | 'multiple'>('single');
  const [reserveDate, setReserveDate] = useState(date);
  const { data: reserveDateSlots = [] } = useSlotsByDate(reserveDate);

  const handleAttemptClose = () => {
    if (state.view === 'reserve') {
      setShowDiscard(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscard(false);
    dispatch({ type: 'back_to_table' });
    onClose();
  };

  const handleAddClick = (pool: string, slotType: 'DAY' | 'NIGHT') => {
    setReserveDate(date);
    dispatch({ type: 'open_reserve', pool, date, slotType });
  };

  const handleBookingClick = (bookingDocId: string) => {
    if (!bookingDocId) return;
    navigate(`/booking/${bookingDocId}`, { state: { modal: true } });
  };

  const handleReserveSuccess = () => {
    dispatch({ type: 'back_to_table' });
  };

  const isReserveView = state.view === 'reserve';

  return (
    <>
      <Dialog open={open} onOpenChange={handleAttemptClose}>
        <DialogContent
          className={
            isReserveView && bookingMode === 'multiple'
              ? 'w-[95vw] sm:max-w-7xl max-h-[90vh] overflow-y-auto'
              : isReserveView && bookingMode === 'single'
              ? 'sm:max-w-lg max-h-[90vh] overflow-y-auto'
              : 'sm:max-w-3xl max-h-[80vh] overflow-y-auto'
          }
        >
          {state.view === 'table' && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <DialogTitle>{dayjs(date).format('ddd, MMM DD YYYY')}</DialogTitle>
                  <div className="flex items-center gap-1 rounded-lg border p-1 text-sm">
                    <Button
                      variant={bookingMode === 'single' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setBookingMode('single')}
                    >
                      Single
                    </Button>
                    <Button
                      variant={bookingMode === 'multiple' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setBookingMode('multiple')}
                    >
                      Multiple
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Pool</TableHead>
                    <TableHead className="w-[25%] text-center">Day</TableHead>
                    <TableHead className="w-[25%] text-center">Night</TableHead>
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
            </>
          )}

          {state.view === 'reserve' && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 px-2 -ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => dispatch({ type: 'back_to_table' })}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <DialogTitle>
                      New Reservation — {state.pool} · {state.slotType} · {reserveDate}
                    </DialogTitle>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border p-1 text-sm">
                    <Button
                      variant={bookingMode === 'single' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setBookingMode('single')}
                    >
                      Single
                    </Button>
                    <Button
                      variant={bookingMode === 'multiple' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setBookingMode('multiple')}
                    >
                      Multiple
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <ReserveForm
                defaultPool={state.pool}
                defaultDate={state.date}
                defaultSlotType={state.slotType}
                hidePoolSelector={bookingMode === 'single'}
                takenSlots={reserveDateSlots
                  .filter((s) => s.status !== 'CANCELLED')
                  .map((s) => ({ pool: s.pool, type: s.type }))}
                onSuccess={handleReserveSuccess}
                onDateChange={setReserveDate}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              Any details you've entered will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
