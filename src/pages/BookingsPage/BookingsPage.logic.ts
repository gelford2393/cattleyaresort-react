import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Booking } from '@/lib/queries';

export function printBookingsPDF(date: string, bookings: Booking[]) {
  const pdf = new jsPDF();
  pdf.text(`Bookings for ${date}`, 14, 20);
  autoTable(pdf, {
    startY: 30,
    head: [['Booking No', 'Customer', 'Total', 'Reserve Fee', 'Status']],
    body: bookings.map((b) => [b.bookingNo, b.customer, `₱${b.total.toLocaleString()}`, `₱${b.reserveFee.toLocaleString()}`, b.status]),
  });
  pdf.save(`bookings-${date}.pdf`);
}
