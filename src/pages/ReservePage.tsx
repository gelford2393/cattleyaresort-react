import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function ReservePage() {
  const navigate = useNavigate();
  const pools = useAppStore((s) => s.pools);
  const [selectedSlots, setSelectedSlots] = useState<{ pool: string; type: 'DAY' | 'NIGHT'; rate: number }[]>([]);
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSlot = (pool: string, type: 'DAY' | 'NIGHT', rate: number) => {
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.pool === pool && s.type === type);
      return exists ? prev.filter((s) => !(s.pool === pool && s.type === type)) : [...prev, { pool, type, rate }];
    });
  };

  const isSelected = (pool: string, type: 'DAY' | 'NIGHT') =>
    selectedSlots.some((s) => s.pool === pool && s.type === type);

  const subTotal = selectedSlots.reduce((sum, s) => sum + s.rate, 0);
  const bookingNo = `CR-${Date.now()}`;

  const handleReserve = async () => {
    if (!customer || !bookingDate || selectedSlots.length === 0) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      const bookingRef = await addDoc(collection(firestore, 'bookings'), {
        bookingNo,
        bookingDate,
        customer,
        email,
        phone,
        slots: selectedSlots,
        subTotal,
        discount: 0,
        total: subTotal,
        reserveFee: 0,
        status: 'PENDING',
        createdBy: user?.email ?? '',
        createdAt: Timestamp.now(),
      });

      await Promise.all(
        selectedSlots.map((slot) =>
          addDoc(collection(firestore, 'slots'), {
            bookingNo,
            bookingDocId: bookingRef.id,
            pool: slot.pool,
            type: slot.type,
            date: bookingDate,
            status: 'PENDING',
          })
        )
      );

      navigate(`/booking/${bookingRef.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reserve</h1>

      {/* Pool selection grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {pools.map((pool) => (
          <Card key={pool.pool} className="p-3">
            <div className="font-medium text-sm mb-2">{pool.pool}</div>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected(pool.pool, 'DAY')}
                  onChange={() => toggleSlot(pool.pool, 'DAY', pool.dayRate)}
                />
                <span className="text-xs">Day ₱{pool.dayRate.toLocaleString()}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected(pool.pool, 'NIGHT')}
                  onChange={() => toggleSlot(pool.pool, 'NIGHT', pool.nightRate)}
                />
                <span className="text-xs">Night ₱{pool.nightRate.toLocaleString()}</span>
              </label>
            </div>
          </Card>
        ))}
      </div>

      {/* Selected slots summary */}
      {selectedSlots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSlots.map((s) => (
            <Badge key={`${s.pool}-${s.type}`} variant="secondary">
              {s.pool} {s.type} ₱{s.rate.toLocaleString()}
            </Badge>
          ))}
          <div className="w-full text-sm font-semibold">Subtotal: ₱{subTotal.toLocaleString()}</div>
        </div>
      )}

      {/* Booking form */}
      <Card>
        <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Customer Name *</Label>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Booking Date *</Label>
            <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleReserve} disabled={loading || !customer || !bookingDate || selectedSlots.length === 0} className="w-full">
        {loading ? 'Reserving...' : 'Reserve'}
      </Button>
    </div>
  );
}
