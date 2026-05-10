import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
  customer: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  gstTax: number;
  amountPaid: number;
  balanceAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  invoiceNumber: string;
  sourceOrderId?: mongoose.Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema: Schema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    gstTax: { type: Number, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    balanceAmount: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String },
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Partial'], default: 'Paid' },
    invoiceNumber: { type: String, required: true, unique: true },
    sourceOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Fix for Next.js hot reloading caching the old schema
if (mongoose.models.Sale) {
  delete mongoose.models.Sale;
}

export default mongoose.model<ISale>('Sale', SaleSchema);
