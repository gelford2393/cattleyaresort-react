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
import { additionalSchema, type AdditionalInput, CHARGE_OPTIONS } from '@/lib/form-schemas';

type AdditionalFormInput = z.input<typeof additionalSchema>;

interface AdditionalItem { description: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (item: AdditionalItem) => void; isPending?: boolean; }

export function AdditionalAdd({ open, onClose, onSave, isPending }: Props) {
  const form = useForm<AdditionalFormInput, unknown, AdditionalInput>({
    resolver: zodResolver(additionalSchema),
    defaultValues: { description: undefined, customDesc: '', amount: undefined },
  });
  const description = useWatch({ control: form.control, name: 'description' });

  const close = () => { form.reset(); onClose(); };

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      description: values.description === 'Others' ? (values.customDesc ?? '') : values.description,
      amount: values.amount,
    });
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Additional Charge</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit}>
          <Stack gap="s0">
            <Stack gap="s-2">
              <Label>Description</Label>
              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select charge type" /></SelectTrigger>
                    <SelectContent>
                      {CHARGE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={form.formState.errors.description?.message} />
            </Stack>
            {description === 'Others' && (
              <Stack gap="s-2">
                <Label>Custom Description</Label>
                <Input {...form.register('customDesc')} />
                <FormError message={form.formState.errors.customDesc?.message} />
              </Stack>
            )}
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
