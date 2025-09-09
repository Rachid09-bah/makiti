import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityScope = 'user' | 'vendor' | 'system';
export type ActivityRole = 'admin' | 'vendor' | 'customer' | undefined;

export interface ActivityDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  role?: ActivityRole;
  scope: ActivityScope;
  action: string; // e.g., 'auth.login', 'auth.logout', 'profile.update', 'vendor.product.create'
  meta?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<ActivityDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String, enum: ['admin', 'vendor', 'customer'], required: false },
    scope: { type: String, enum: ['user', 'vendor', 'system'], required: true, index: true },
    action: { type: String, required: true, index: true },
    meta: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ scope: 1, action: 1, createdAt: -1 });

export const Activity: Model<ActivityDocument> =
  mongoose.models.Activity || mongoose.model<ActivityDocument>('Activity', ActivitySchema);

export interface RecordActivityParams {
  userId?: string | mongoose.Types.ObjectId;
  role?: ActivityRole;
  scope: ActivityScope;
  action: string;
  meta?: Record<string, any>;
  req?: { ip?: string; headers?: Record<string, any> } | any;
}

export async function recordActivity(params: RecordActivityParams): Promise<ActivityDocument> {
  const { userId, role, scope, action, meta, req } = params;
  const ip = (req?.ip || req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || '').toString() || undefined;
  const userAgent = (req?.headers?.['user-agent'] || '').toString() || undefined;
  const doc = await Activity.create({
    userId: userId ? new mongoose.Types.ObjectId(String(userId)) : undefined,
    role,
    scope,
    action,
    meta,
    ip,
    userAgent,
  });
  return doc;
}
