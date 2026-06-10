import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Payment } from '@/lib/queries';

export function groupPaymentsByType(payments: Payment[]): Record<string, number> {
  return payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.amount;
    return acc;
  }, {});
}

export function printPaymentsPDF(date: string, payments: Payment[]) {
  const pdf = new jsPDF();
  pdf.text(`Payments for ${date}`, 14, 20);
  autoTable(pdf, {
    startY: 30,
    head: [['Type', 'Date', 'Reference', 'Booking No', 'Amount']],
    body: payments.map((p) => [p.type, p.date, p.referenceNo, p.bookingNo, `₱${p.amount.toLocaleString()}`]),
  });
  pdf.save(`payments-${date}.pdf`);
}
