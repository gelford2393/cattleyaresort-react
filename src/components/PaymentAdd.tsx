import { useState } from 'react';
import React from 'react';
import { IMaskInput } from 'react-imask';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAYMENT_TYPES = ['Cash', 'Bank Deposit', 'Bank Transfer', 'WTax', 'Refund'];

interface Payment { type: string; date: string; referenceNo: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (p: Payment) => void; }

const DateMaskInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'> & { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }
>(({ onChange, ...other }, ref) => (
  <IMaskInput
    {...(other as object)}
    mask={"0000-00-00 00:00:00" as unknown as RegExp}
    inputRef={ref}
    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
    onAccept={(value: string) => onChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
  />
));
DateMaskInput.displayName = 'DateMaskInput';

export function PaymentAdd({ open, onClose, onSave }: Props) {
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [amount, setAmount] = useState('');

  const handleSave = () => {
    if (!type || !amount) return;
    onSave({ type, date, referenceNo, amount: parseFloat(amount) });
    setType(''); setDate(''); setReferenceNo(''); setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Payment Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{type === 'Bank Deposit' ? 'Deposit Date (YYYY-MM-DD HH:MM:SS)' : 'Date'}</Label>
            {type === 'Bank Deposit'
              ? <DateMaskInput value={date} onChange={(e) => setDate(e.target.value)} />
              : <Input value={date} onChange={(e) => setDate(e.target.value)} />
            }
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reference No.</Label>
            <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
