import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'vendor' | 'customer';

export interface UserDocument extends Document {
	name: string;
	email: string;
	phone?: string;
	passwordHash: string;
	role: UserRole;
	verified: boolean;
	photoUrl?: string;
	passwordResetTokenHash?: string;
	passwordResetExpiresAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, index: true },
		phone: { type: String },
		passwordHash: { type: String, required: true },
		role: { type: String, enum: ['admin', 'vendor', 'customer'], default: 'customer', index: true },
		verified: { type: Boolean, default: false }
		,
		photoUrl: { type: String },
		passwordResetTokenHash: { type: String },
		passwordResetExpiresAt: { type: Date }
	},
	{ timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<UserDocument> =
	mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
