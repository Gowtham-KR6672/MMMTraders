import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  source: string;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema: Schema = new Schema(
  {
    source: { type: String, required: true }, // or category
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);
