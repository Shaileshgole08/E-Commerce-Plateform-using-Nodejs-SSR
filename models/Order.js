const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: String,
            image: String,
            price: { type: Number, required: true },
            quantity: { type: Number, required: true, min: 1 }
        }
    ],
    shippingAddress: {
        name: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Online'],
        default: 'COD'
    },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    orderNumber: {
        type: String,
        unique: true
    }
}, { timestamps: true });

orderSchema.pre('save', function () {
    if (!this.orderNumber) {
        this.orderNumber = 'RBH-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
});

module.exports = mongoose.model('Order', orderSchema);
