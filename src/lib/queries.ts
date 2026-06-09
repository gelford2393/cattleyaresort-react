import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import { firestore } from './firebase';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface BookingDetail {
  bookingNo: string;
  bookingDate: string;
  customer: string;
  email: string;
  phone: string;
  slots: { pool: string; type: string; rate: number }[];
  subTotal: number;
  discount: number;
  total: number;
  reserveFee: number;
  status: string;
  createdBy: string;
  discounts?: { careOfBy: string; others: string; amount: number }[];
  additionals?: { description: string; amount: number }[];
}

export interface Booking {
  id: string;
  bookingNo: string;
  bookingDate: string;
  customer: string;
  total: number;
  reserveFee: number;
  status: string;
}

export interface Slot {
  id: string;
  pool: string;
  type: 'DAY' | 'NIGHT';
  date: string;
  status: string;
  bookingNo: string;
  bookingDocId?: string;
}

export interface Payment {
  id: string;
  type: string;
  date: string;
  referenceNo: string;
  amount: number;
  bookingNo: string;
  bookingDocId?: string;
}

// ─── Booking Fetchers ─────────────────────────────────────────────────────────

export async function fetchBookingDetail(id: string): Promise<BookingDetail | null> {
  const snap = await getDoc(doc(firestore, 'bookings', id));
  return snap.exists() ? (snap.data() as BookingDetail) : null;
}

export async function fetchBookingsByDate(date: string): Promise<Booking[]> {
  const snap = await getDocs(
    query(collection(firestore, 'bookings'), where('bookingDate', '==', date))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
}

export async function fetchBookingSearch(q: string): Promise<Booking[]> {
  const [byName, byNo] = await Promise.all([
    getDocs(
      query(
        collection(firestore, 'bookings'),
        where('customer', '>=', q),
        where('customer', '<=', q + '￿')
      )
    ),
    getDocs(
      query(collection(firestore, 'bookings'), where('bookingNo', '==', q))
    ),
  ]);
  const combined = new Map<string, Booking>();
  [...byName.docs, ...byNo.docs].forEach((d) =>
    combined.set(d.id, { id: d.id, ...d.data() } as Booking)
  );
  return [...combined.values()];
}

// ─── Slot Fetchers ────────────────────────────────────────────────────────────

export async function fetchSlotsByDate(date: string): Promise<Slot[]> {
  const snap = await getDocs(
    query(collection(firestore, 'slots'), where('date', '==', date))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Slot);
}

export async function fetchSlotsByMonth(year: number, month: number): Promise<Slot[]> {
  const base = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const start = base.startOf('month').format('YYYY-MM-DD');
  const end = base.endOf('month').format('YYYY-MM-DD');
  const snap = await getDocs(
    query(
      collection(firestore, 'slots'),
      where('date', '>=', start),
      where('date', '<=', end)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Slot);
}

// ─── Payment Fetchers ─────────────────────────────────────────────────────────

export async function fetchPaymentsByBooking(bookingId: string): Promise<Payment[]> {
  const snap = await getDocs(
    query(collection(firestore, 'payments'), where('bookingDocId', '==', bookingId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment);
}

export async function fetchPaymentsByDate(date: string): Promise<Payment[]> {
  const snap = await getDocs(
    query(collection(firestore, 'payments'), where('date', '==', date))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment);
}
