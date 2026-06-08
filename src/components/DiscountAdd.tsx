import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CARE_OF_OPTIONS = ['Mr. Benito', 'Mrs. Benito', 'Others'];

interface Discount { careOfBy: string; others: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (d: Discount) => void; }

export function DiscountAdd({ open, onClose, onSave }: Props) {
  const [careOfBy, setCareOfBy] = useState('');
  const [others, setOthers] = useState('');
  const [amount, setAmount] = useState('');

  const handleSave = () => {
    if (!careOfBy || !amount) return;
    onSave({ careOfBy, others, amount: parseFloat(amount) });
    setCareOfBy(''); setOthers(''); setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Discount</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Care of By</Label>
            <Select value={careOfBy} onValueChange={setCareOfBy}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CARE_OF_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {careOfBy === 'Others' && (
            <div className="flex flex-col gap-1.5">
              <Label>Reason</Label>
              <Input value={others} onChange={(e) => setOthers(e.target.value)} />
            </div>
          )}
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
