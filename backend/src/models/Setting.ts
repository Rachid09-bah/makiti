import mongoose, { Schema, Document, Model } from 'mongoose';

export interface SettingDocument extends Document {
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<SettingDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SettingSchema.index({ key: 1 }, { unique: true });

export const Setting: Model<SettingDocument> =
  mongoose.models.Setting || mongoose.model<SettingDocument>('Setting', SettingSchema);
