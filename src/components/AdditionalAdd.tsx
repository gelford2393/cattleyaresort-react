import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CHARGE_OPTIONS = ['Extra Head', 'Catering', 'Ice', 'Mattress', 'Sound System', 'Water', 'Others'];

interface AdditionalItem { description: string; amount: number; }
interface Props { open: boolean; onClose: () => void; onSave: (item: AdditionalItem) => void; }

export function AdditionalAdd({ open, onClose, onSave }: Props) {
  const [description, setDescription] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [amount, setAmount] = useState('');

  const handleSave = () => {
    if (!description || !amount) return;
    onSave({ description: description === 'Others' ? customDesc : description, amount: parseFloat(amount) });
    setDescription(''); setCustomDesc(''); setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Additional Charge</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Select value={description} onValueChange={setDescription}>
              <SelectTrigger><SelectValue placeholder="Select charge type" /></SelectTrigger>
              <SelectContent>
                {CHARGE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {description === 'Others' && (
            <div className="flex flex-col gap-1.5">
              <Label>Custom Description</Label>
              <Input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} />
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
