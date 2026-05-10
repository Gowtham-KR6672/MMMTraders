import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 }, // Document will automatically be deleted at expiresAt
  },
  { timestamps: true }
);

export default mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);
