import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ProductDocument extends Document {
	vendorId: mongoose.Types.ObjectId;
	title: string;
	description?: string;
	images: string[];
	price: number;
	stock: number;
	categoryId?: mongoose.Types.ObjectId;
	tags: string[];
	status: 'active' | 'inactive' | 'pending';
	isRecommended: boolean;
	ratingAvg: number;
	ratingCount: number;
	createdAt: Date;
	updatedAt: Date;
}

const ProductSchema = new Schema<ProductDocument>(
	{
		vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
		title: { type: String, required: true, trim: true },
		description: { type: String },
		images: { type: [String], default: [] },
		price: { type: Number, required: true, min: 0 },
		stock: { type: Number, required: true, min: 0 },
		categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
		tags: { type: [String], default: [] },
		status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending', index: true },
		isRecommended: { type: Boolean, default: false, index: true },
		ratingAvg: { type: Number, default: 0 },
		ratingCount: { type: Number, default: 0 }
	},
	{ timestamps: true }
);

ProductSchema.index({ title: 'text', description: 'text' });

export const Product: Model<ProductDocument> =
	mongoose.models.Product || mongoose.model<ProductDocument>('Product', ProductSchema);
