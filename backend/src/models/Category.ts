import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CategoryDocument extends Document {
	name: string;
	slug: string;
	parentId?: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
	{
		name: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, lowercase: true, index: true },
		parentId: { type: Schema.Types.ObjectId, ref: 'Category' }
	},
	{ timestamps: true }
);

CategorySchema.index({ slug: 1 }, { unique: true });

export const Category: Model<CategoryDocument> =
	mongoose.models.Category || mongoose.model<CategoryDocument>('Category', CategorySchema);
