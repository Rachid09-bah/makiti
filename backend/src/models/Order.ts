import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
	productId: mongoose.Types.ObjectId;
	title: string;
	price: number;
	qty: number;
}

export interface OrderDocument extends Document {
	customerId: mongoose.Types.ObjectId;
	vendorId: mongoose.Types.ObjectId;
	items: OrderItem[];
	subtotal: number;
	deliveryFee: number;
	commissionAmount: number;
	total: number;
	status: OrderStatus;
	paymentStatus: PaymentStatus;
	paymentRef?: string;
	deliveryAddress?: string;
	timeline: { status: string; at: Date }[];
	createdAt: Date;
	updatedAt: Date;
}

const OrderSchema = new Schema<OrderDocument>(
	{
		customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
		items: [
			{
				productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
				title: { type: String, required: true },
				price: { type: Number, required: true },
				qty: { type: Number, required: true, min: 1 }
			}
		],
		subtotal: { type: Number, required: true },
		deliveryFee: { type: Number, required: true },
		commissionAmount: { type: Number, required: true },
		total: { type: Number, required: true },
		status: { type: String, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
		paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
		paymentRef: { type: String },
		deliveryAddress: { type: String },
		timeline: { type: [{ status: String, at: Date }], default: [] }
	},
	{ timestamps: true }
);

export const Order: Model<OrderDocument> =
	mongoose.models.Order || mongoose.model<OrderDocument>('Order', OrderSchema);
