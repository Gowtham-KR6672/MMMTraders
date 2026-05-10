import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customer: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'Pending' | 'Order Accepted' | 'In Packing' | 'In Transit' | 'Delivered' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Order Accepted', 'In Packing', 'In Transit', 'Delivered', 'Rejected'], default: 'Pending' }
  },
  { timestamps: true }
);

// Delete the existing model to prevent OverwriteModelError during hot reloads in Next.js
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.model<IOrder>('Order', OrderSchema);
