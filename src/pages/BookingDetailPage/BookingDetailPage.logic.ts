import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BookingDetail, Payment } from '@/lib/queries';

export function printBookingPDF(booking: BookingDetail, payments: Payment[]) {
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = booking.total - totalPayments;

  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text('Cattleya Resort - Booking Receipt', 14, 20);
  pdf.setFontSize(11);
  pdf.text(`Booking No: ${booking.bookingNo}`, 14, 35);
  pdf.text(`Date: ${booking.bookingDate}`, 14, 42);
  pdf.text(`Customer: ${booking.customer}`, 14, 49);
  pdf.text(`Status: ${booking.status}`, 14, 56);
  autoTable(pdf, {
    startY: 65,
    head: [['Pool', 'Type', 'Rate']],
    body: booking.slots.map((s) => [s.pool, s.type, `₱${s.rate.toLocaleString()}`]),
  });
  const finalY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  pdf.text(`Subtotal: ₱${booking.subTotal.toLocaleString()}`, 14, finalY);
  pdf.text(`Discount: ₱${(booking.discount ?? 0).toLocaleString()}`, 14, finalY + 7);
  pdf.text(`Total: ₱${booking.total.toLocaleString()}`, 14, finalY + 14);
  pdf.text(`Paid: ₱${totalPayments.toLocaleString()}`, 14, finalY + 21);
  pdf.text(`Balance: ₱${balance.toLocaleString()}`, 14, finalY + 28);
  pdf.save(`${booking.bookingNo}.pdf`);
}
