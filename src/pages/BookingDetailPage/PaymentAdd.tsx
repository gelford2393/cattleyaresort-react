import { useForm, useWatch, Controller } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { DatePicker } from '@/components/DatePicker';
import { paymentSchema, type PaymentInput, PAYMENT_TYPES } from '@/lib/form-schemas';

type PaymentFormInput = z.input<typeof paymentSchema>;

interface Payment { type: string; date: string; referenceNo: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (p: Payment) => void; isPending?: boolean; }

export function PaymentAdd({ open, onClose, onSave, isPending }: Props) {
  const form = useForm<PaymentFormInput, unknown, PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { type: undefined, date: '', referenceNo: '', amount: undefined },
  });
  const type = useWatch({ control: form.control, name: 'type' });

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
              <Label>{type === 'Bank Deposit' ? 'Deposit Date' : 'Date'}</Label>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder={type === 'Bank Deposit' ? 'Select deposit date' : 'Select date'}
                  />
                )}
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
              <Button type="button" variant="outline" onClick={close} disabled={isPending}>Close</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
