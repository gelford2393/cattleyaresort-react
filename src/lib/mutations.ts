import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, firestore } from './firebase';
import type { SlotInput } from './form-schemas';

export interface CreateBookingInput {
  bookingDate: string;
  customer: string;
  email: string;
  phone: string;
  slots: SlotInput[];
  subTotal: number;
}

export interface CreatePaymentInput {
  bookingDocId: string;
  bookingNo: string;
  type: string;
  date: string;
  referenceNo: string;
  amount: number;
}

export async function createBooking(input: CreateBookingInput): Promise<string> {
  // Conflict check — reject if any requested slot is already taken for this date
  const existingSnap = await getDocs(
    query(collection(firestore, 'slots'), where('date', '==', input.bookingDate))
  );
  const takenCombos = new Set(
    existingSnap.docs
      .filter((d) => d.data().status !== 'CANCELLED')
      .map((d) => `${d.data().pool}-${d.data().type}`)
  );
  const conflicts = input.slots.filter((s) => takenCombos.has(`${s.pool}-${s.type}`));
  if (conflicts.length > 0) {
    throw new Error(
      `Slot(s) already taken: ${conflicts.map((s) => `${s.pool} ${s.type}`).join(', ')}`
    );
  }

  const bookingNo = `CR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const user = auth.currentUser;
  const reserveFee = input.slots.reduce((sum, s) => sum + s.depositRate, 0);

  const bookingRef = await addDoc(collection(firestore, 'bookings'), {
    bookingNo,
    bookingDate: input.bookingDate,
    customer: input.customer,
    email: input.email,
    phone: input.phone,
    slots: input.slots,
    subTotal: input.subTotal,
    discount: 0,
    total: input.subTotal,
    reserveFee,
    status: 'PENDING',
    createdBy: user?.email ?? '',
    createdAt: Timestamp.now(),
  });
  await Promise.all(
    input.slots.map((slot) =>
      addDoc(collection(firestore, 'slots'), {
        bookingNo,
        bookingDocId: bookingRef.id,
        pool: slot.pool,
        type: slot.type,
        date: input.bookingDate,
        status: 'PENDING',
      })
    )
  );
  return bookingRef.id;
}

async function syncSlotsStatus(bookingDocId: string, status: string): Promise<void> {
  const snap = await getDocs(
    query(collection(firestore, 'slots'), where('bookingDocId', '==', bookingDocId))
  );
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { status })));
}

export async function updateBookingStatus(id: string, status: string): Promise<void> {
  await updateDoc(doc(firestore, 'bookings', id), { status });
  await syncSlotsStatus(id, status);
}

export async function updateBookingDiscounts(
  id: string,
  discounts: { careOfBy: string; others: string; amount: number }[],
  total: number
): Promise<void> {
  await updateDoc(doc(firestore, 'bookings', id), {
    discounts,
    discount: discounts.reduce((s, d) => s + d.amount, 0),
    total,
  });
}

export async function updateBookingAdditionals(
  id: string,
  additionals: { description: string; amount: number }[],
  total: number
): Promise<void> {
  await updateDoc(doc(firestore, 'bookings', id), { additionals, total });
}

export async function createPayment(input: CreatePaymentInput): Promise<void> {
  await addDoc(collection(firestore, 'payments'), {
    ...input,
    createdAt: Timestamp.now(),
  });
  // Auto-upgrade PENDING → BOOKED when any payment is recorded
  const bookingSnap = await getDoc(doc(firestore, 'bookings', input.bookingDocId));
  if (bookingSnap.exists() && bookingSnap.data().status === 'PENDING') {
    await updateBookingStatus(input.bookingDocId, 'BOOKED');
  }
}

export async function deleteBookingCascade(id: string, bookingNo: string): Promise<void> {
  const [slotsSnap, paymentsSnap] = await Promise.all([
    getDocs(query(collection(firestore, 'slots'), where('bookingNo', '==', bookingNo))),
    getDocs(query(collection(firestore, 'payments'), where('bookingDocId', '==', id))),
  ]);
  await Promise.all([
    deleteDoc(doc(firestore, 'bookings', id)),
    ...slotsSnap.docs.map((d) => deleteDoc(d.ref)),
    ...paymentsSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);
}
