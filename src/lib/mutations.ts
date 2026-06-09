import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
  const bookingNo = `CR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const user = auth.currentUser;
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
    reserveFee: 0,
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

export async function updateBookingStatus(id: string, status: string): Promise<void> {
  await updateDoc(doc(firestore, 'bookings', id), { status });
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
