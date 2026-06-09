import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IMaskInput } from 'react-imask';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { paymentSchema, type PaymentInput, PAYMENT_TYPES } from '@/lib/form-schemas';

type PaymentFormInput = z.input<typeof paymentSchema>;

interface Payment { type: string; date: string; referenceNo: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (p: Payment) => void; }

const DateMaskInput = React.forwardRef<
  HTMLInputElement,
  { value?: string; onChange: (value: string) => void }
>(({ value, onChange }, ref) => (
  <IMaskInput
    value={value}
    mask={'0000-00-00 00:00:00' as unknown as RegExp}
    inputRef={ref}
    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
    onAccept={(v: string) => onChange(v)}
  />
));
DateMaskInput.displayName = 'DateMaskInput';

export function PaymentAdd({ open, onClose, onSave }: Props) {
  const form = useForm<PaymentFormInput, unknown, PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { type: undefined, date: '', referenceNo: '', amount: undefined },
  });
  const type = form.watch('type');

  const close = () => { form.reset(); onClose(); };

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      type: values.type,
      date: values.date ?? '',
      referenceNo: values.referenceNo ?? '',
      amount: values.amount,
    });
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap="s0">
            <Stack gap="s-2">
              <Label>Payment Type</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={form.formState.errors.type?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>{type === 'Bank Deposit' ? 'Deposit Date (YYYY-MM-DD HH:MM:SS)' : 'Date'}</Label>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) =>
                  type === 'Bank Deposit'
                    ? <DateMaskInput value={field.value} onChange={field.onChange} />
                    : <Input value={field.value ?? ''} onChange={field.onChange} />
                }
              />
              <FormError message={form.formState.errors.date?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>Reference No.</Label>
              <Input {...form.register('referenceNo')} />
              <FormError message={form.formState.errors.referenceNo?.message} />
            </Stack>
            <Stack gap="s-2">
              <Label>Amount</Label>
              <Input type="number" {...form.register('amount')} />
              <FormError message={form.formState.errors.amount?.message} />
            </Stack>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Close</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
