import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReviewTarget = 'product' | 'vendor';

export interface ReviewDocument extends Document {
	targetType: ReviewTarget;
	targetId: mongoose.Types.ObjectId;
	authorId: mongoose.Types.ObjectId;
	rating: number;
	comment?: string;
	createdAt: Date;
	updatedAt: Date;
}

const ReviewSchema = new Schema<ReviewDocument>(
	{
		targetType: { type: String, enum: ['product', 'vendor'], required: true, index: true },
		targetId: { type: Schema.Types.ObjectId, required: true, index: true },
		authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		rating: { type: Number, required: true, min: 1, max: 5 },
		comment: { type: String }
	},
	{ timestamps: true }
);

export const Review: Model<ReviewDocument> =
	mongoose.models.Review || mongoose.model<ReviewDocument>('Review', ReviewSchema);
