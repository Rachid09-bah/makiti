import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface TransactionDocument extends Document {
	orderId: mongoose.Types.ObjectId;
	amount: number;
	provider: string;
	type: 'debit' | 'credit';
	status: TransactionStatus;
	rawPayload?: any;
	createdAt: Date;
	updatedAt: Date;
}

const TransactionSchema = new Schema<TransactionDocument>(
	{
		orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
		amount: { type: Number, required: true },
		provider: { type: String, required: true },
		type: { type: String, enum: ['debit', 'credit'], required: true },
		status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
		rawPayload: {}
	},
	{ timestamps: true }
);

export const Transaction: Model<TransactionDocument> =
	mongoose.models.Transaction || mongoose.model<TransactionDocument>('Transaction', TransactionSchema);
