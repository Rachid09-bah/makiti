import mongoose, { Schema, Document, Model } from 'mongoose';

export type VendorStatus = 'pending' | 'approved' | 'rejected';

export interface VendorDocument extends Document {
	userId: mongoose.Types.ObjectId;
	name: string;
	description?: string;
	logoUrl?: string;
	location?: string;
	status: VendorStatus;
	payoutMobileMoney?: { msisdn: string; provider: string };
	createdAt: Date;
	updatedAt: Date;
}

const VendorSchema = new Schema<VendorDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		name: { type: String, required: true, trim: true },
		description: { type: String },
		logoUrl: { type: String },
		location: { type: String },
		status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
		payoutMobileMoney: {
			msisdn: { type: String },
			provider: { type: String }
		}
	},
	{ timestamps: true }
);

export const Vendor: Model<VendorDocument> =
	mongoose.models.Vendor || mongoose.model<VendorDocument>('Vendor', VendorSchema);
