import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
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
  // Use deterministic slot doc IDs so we can atomically check and write each slot
  // inside a transaction, preventing double-bookings from concurrent requests.
  const slotRefs = input.slots.map((s) =>
    doc(firestore, 'slots', `${input.bookingDate}_${s.pool}_${s.type}`)
  );
  const bookingRef = doc(collection(firestore, 'bookings'));
  const bookingNo = `CR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const user = auth.currentUser;
  const reserveFee = input.slots.reduce((sum, s) => sum + s.depositRate, 0);

  await runTransaction(firestore, async (tx) => {
    const slotSnaps = await Promise.all(slotRefs.map((ref) => tx.get(ref)));
    const conflicts = input.slots.filter(
      (_, i) => slotSnaps[i].exists() && slotSnaps[i].data()!.status !== 'CANCELLED'
    );
    if (conflicts.length > 0) {
      throw new Error(
        `Slot(s) already taken: ${conflicts.map((s) => `${s.pool} ${s.type}`).join(', ')}`
      );
    }

    tx.set(bookingRef, {
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

    input.slots.forEach((slot, i) => {
      tx.set(slotRefs[i], {
        bookingNo,
        bookingDocId: bookingRef.id,
        pool: slot.pool,
        type: slot.type,
        date: input.bookingDate,
        status: 'PENDING',
      });
    });
  });

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
