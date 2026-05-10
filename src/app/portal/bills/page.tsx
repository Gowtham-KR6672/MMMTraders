'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerBillsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchMyBills = async () => {
    try {
      const meRes = await axios.get('/api/auth/me');
      const customerId = meRes.data.user.id;
      setCustomerInfo(meRes.data.user);
      const salesRes = await axios.get(`/api/sales?customerId=${customerId}`);
      const mySales = salesRes.data.filter((s: any) => s.customer && s.customer._id === customerId);
      setSales(mySales);
    } catch (error) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBills();
    const interval = setInterval(fetchMyBills, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Paid') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    if (status === 'Partial') return 'bg-blue-500/10 text-blue-600 border-blue-200';
    if (status === 'Pending') return 'bg-amber-500/10 text-amber-600 border-amber-200';
    return 'bg-red-500/10 text-red-600 border-red-200';
  };

  const downloadInvoice = async (sale: any) => {
    setDownloadingId(sale._id);
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ── Header background ──────────────────────────────────────────────────
      doc.setFillColor(249, 115, 22); // orange-500
      doc.rect(0, 0, pageWidth, 42, 'F');

      // ── Logo (fetch & embed) ───────────────────────────────────────────────
      let logoBase64: string | null = null;
      try {
        const logoRes = await fetch('/logo.png');
        const logoBlob = await logoRes.blob();
        logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoBlob);
        });
      } catch {
        // If logo fails to load, continue without it
      }

      if (logoBase64) {
        // White rounded box behind the logo
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(9, 5, 32, 32, 3, 3, 'F');
        // Image fills the box exactly — no white border visible
        doc.addImage(logoBase64, 'PNG', 9, 5, 32, 32);
      }

      // ── Company Name (shifted right if logo is present) ────────────────────
      const textStartX = logoBase64 ? 46 : 14;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('MMM TRADERS', textStartX, 17);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Thamaraipalayam, Unjalur Vazhi', textStartX, 25);
      doc.text('Manojmuruganm66@gmail.com  |  9787168804', textStartX, 32);

      // ── INVOICE label (top right) ──────────────────────────────────────────
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('INVOICE', pageWidth - 14, 22, { align: 'right' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(sale.invoiceNumber, pageWidth - 14, 31, { align: 'right' });


      // ── Reset text color ───────────────────────────────────────────────────
      doc.setTextColor(30, 41, 59); // slate-800

      // ── Invoice meta info block ────────────────────────────────────────────
      const infoY = 50;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('BILL TO', 14, infoY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const customerName = sale.customer?.name || customerInfo?.name || 'Customer';
      const customerPhone = sale.customer?.phone || '';
      const customerEmail = sale.customer?.email || '';
      
      doc.text(customerName, 14, infoY + 6);
      if (customerPhone) doc.text(`Phone: ${customerPhone}`, 14, infoY + 12);
      if (customerEmail) doc.text(`Email: ${customerEmail}`, 14, infoY + 18);

      // Right side invoice details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const detailX = pageWidth / 2 + 10;
      doc.text('Invoice Number:', detailX, infoY);
      doc.text('Invoice Date:', detailX, infoY + 8);
      doc.text('Payment Status:', detailX, infoY + 16);
      doc.text('Due Amount:', detailX, infoY + 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(sale.invoiceNumber, pageWidth - 14, infoY, { align: 'right' });
      doc.text(new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), pageWidth - 14, infoY + 8, { align: 'right' });
      doc.text(sale.paymentStatus, pageWidth - 14, infoY + 16, { align: 'right' });
      
      const balanceColor = sale.balanceAmount > 0 ? [220, 38, 38] : [22, 163, 74];
      doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${sale.balanceAmount?.toLocaleString('en-IN') || '0'}`, pageWidth - 14, infoY + 24, { align: 'right' });
      doc.setTextColor(30, 41, 59);

      // ── Divider ────────────────────────────────────────────────────────────
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, infoY + 32, pageWidth - 14, infoY + 32);

      // ── Items Table ────────────────────────────────────────────────────────
      autoTable(doc, {
        startY: infoY + 38,
        head: [['#', 'Product / Description', 'Qty', 'Unit Price (Rs.)', 'Total (Rs.)']],
        body: [
          [
            '1',
            sale.productName,
            sale.quantity?.toString(),
            `Rs. ${sale.unitPrice?.toLocaleString('en-IN')}`,
            `Rs. ${sale.totalAmount?.toLocaleString('en-IN')}`,
          ],
        ],
        headStyles: {
          fillColor: [249, 115, 22],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
        theme: 'striped',
      });

      // ── Totals block ───────────────────────────────────────────────────────
      const finalY = (doc as any).lastAutoTable.finalY + 8;
      const totalsX = pageWidth - 90;

      // Background box for totals
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(totalsX - 4, finalY - 4, 90 - 14 + 4 + 4, 42, 3, 3, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Subtotal:', totalsX, finalY + 4);
      doc.text('GST / Tax:', totalsX, finalY + 12);
      doc.text('Amount Paid:', totalsX, finalY + 20);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`Rs. ${sale.totalAmount?.toLocaleString('en-IN')}`, pageWidth - 14, finalY + 4, { align: 'right' });
      doc.text(`Rs. ${sale.gstTax?.toLocaleString('en-IN') || '0'}`, pageWidth - 14, finalY + 12, { align: 'right' });
      doc.text(`Rs. ${sale.amountPaid?.toLocaleString('en-IN') || '0'}`, pageWidth - 14, finalY + 20, { align: 'right' });

      // Balance due (highlighted)
      doc.setDrawColor(229, 231, 235);
      doc.line(totalsX - 4, finalY + 25, pageWidth - 14, finalY + 25);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Balance Due:', totalsX, finalY + 33);

      const balAmt = sale.balanceAmount || 0;
      doc.setTextColor(balAmt > 0 ? 220 : 22, balAmt > 0 ? 38 : 163, balAmt > 0 ? 38 : 74);
      doc.text(`Rs. ${balAmt.toLocaleString('en-IN')}`, pageWidth - 14, finalY + 33, { align: 'right' });

      // ── Footer ─────────────────────────────────────────────────────────────
      doc.setFillColor(249, 250, 251);
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business with MMM Traders!', pageWidth / 2, pageHeight - 12, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} | ${sale.invoiceNumber}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

      // ── Save PDF ───────────────────────────────────────────────────────────
      doc.save(`Invoice-${sale.invoiceNumber}.pdf`);
      toast.success(`Invoice ${sale.invoiceNumber} downloaded!`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)]">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <FileText size={24} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">My Bills & Invoices</h2>
          <p className="text-sm text-slate-500 mt-0.5">Download your PDF invoices</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center gap-2 py-16 text-slate-500">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          Loading bills...
        </div>
      )}

      {/* Empty */}
      {!loading && sales.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100">
          No bills found.
        </div>
      )}

      {/* ── Mobile: Card list (hidden on md+) ─────────────────────────── */}
      {!loading && sales.length > 0 && (
        <div className="flex flex-col gap-4 md:hidden">
          {sales.map((sale: any) => (
            <div
              key={sale._id}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] p-4 space-y-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{sale.invoiceNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(sale.date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Badge className={`border ${getStatusColor(sale.paymentStatus)} bg-transparent shadow-none rounded-full px-3 py-0.5 text-xs flex-shrink-0`}>
                  {sale.paymentStatus}
                </Badge>
              </div>

              {/* Product */}
              <div className="bg-slate-50 rounded-xl px-3 py-2">
                <p className="font-semibold text-slate-700 text-sm">{sale.productName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sale.quantity} units × ₹{sale.unitPrice}</p>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-slate-500">Total Amount</p>
                  <p className="font-bold text-slate-800 text-sm">₹{sale.totalAmount?.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-slate-500">Balance Due</p>
                  {sale.balanceAmount > 0 ? (
                    <p className="font-bold text-red-600 text-sm">₹{sale.balanceAmount.toLocaleString('en-IN')}</p>
                  ) : (
                    <p className="font-bold text-emerald-600 text-sm">Paid ✓</p>
                  )}
                </div>
              </div>

              {/* Download button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadInvoice(sale)}
                disabled={downloadingId === sale._id}
                className="w-full rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold"
              >
                {downloadingId === sale._id ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" /> Generating PDF...</>
                ) : (
                  <><Download size={14} className="mr-2" /> Download PDF</>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop: Table (hidden on mobile) ─────────────────────────── */}
      {!loading && sales.length > 0 && (
        <Card className="hidden md:block shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border-slate-100 rounded-3xl overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b-slate-100 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-600 h-12">Invoice No</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Date</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Product</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12">Total</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12">Balance</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 h-12 w-[120px]">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale: any) => (
                <TableRow key={sale._id} className="hover:bg-indigo-50/30 transition-colors border-b-slate-100">
                  <TableCell className="font-medium text-slate-800">{sale.invoiceNumber}</TableCell>
                  <TableCell className="text-slate-600">{new Date(sale.date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-700">{sale.productName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{sale.quantity} x ₹{sale.unitPrice}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${getStatusColor(sale.paymentStatus)} bg-transparent shadow-none rounded-full px-3 py-0.5`}>
                      {sale.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-800">
                    ₹{sale.totalAmount?.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.balanceAmount > 0 ? (
                      <span className="font-bold text-red-600">₹{sale.balanceAmount.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">Paid ✓</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoice(sale)}
                      disabled={downloadingId === sale._id}
                      className="rounded-xl border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 min-w-[80px]"
                    >
                      {downloadingId === sale._id ? (
                        <><Loader2 size={14} className="mr-1 animate-spin" /> Wait</>
                      ) : (
                        <><Download size={14} className="mr-1" /> PDF</>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
