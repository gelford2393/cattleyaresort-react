import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { discountSchema, type DiscountInput, CARE_OF_OPTIONS } from '@/lib/form-schemas';

type DiscountFormInput = z.input<typeof discountSchema>;

interface Discount { careOfBy: string; others: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (d: Discount) => void; }

export function DiscountAdd({ open, onClose, onSave }: Props) {
  const form = useForm<DiscountFormInput, unknown, DiscountInput>({
    resolver: zodResolver(discountSchema),
    defaultValues: { careOfBy: undefined, others: '', amount: undefined },
  });
  const careOfBy = useWatch({ control: form.control, name: 'careOfBy' });

  const close = () => { form.reset(); onClose(); };

  const onSubmit = form.handleSubmit((values) => {
    onSave({ careOfBy: values.careOfBy, others: values.others ?? '', amount: values.amount });
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Discount</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap="s0">
            <Stack gap="s-2">
              <Label>Care of By</Label>
              <Controller
                control={form.control}
                name="careOfBy"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {CARE_OF_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={form.formState.errors.careOfBy?.message} />
            </Stack>
            {careOfBy === 'Others' && (
              <Stack gap="s-2">
                <Label>Reason</Label>
                <Input {...form.register('others')} />
                <FormError message={form.formState.errors.others?.message} />
              </Stack>
            )}
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
