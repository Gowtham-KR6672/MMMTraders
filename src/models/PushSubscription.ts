import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: string;         // either customer._id or admin user._id
  role: 'admin' | 'customer';
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}

const PushSubscriptionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], required: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  { timestamps: true }
);

if (mongoose.models.PushSubscription) {
  delete mongoose.models.PushSubscription;
}

export default mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
