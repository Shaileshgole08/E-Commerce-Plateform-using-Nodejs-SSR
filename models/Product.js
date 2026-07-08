const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Handbags', 'Backpacks', 'Clutches', 'Tote Bags', 'Shoulder Bags', 'Travel Bags', 'Wallets', 'Other']
    },
    images: [{
        type: String,
        default: '/images/bag-placeholder.svg'
    }],
    stock: {
        type: Number,
        required: [true, 'Stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    material: { type: String, default: '' },
    brand: { type: String, default: 'Raju Bag House' },
    colors: [{ type: String }],
    sizes: [{ type: String }],
    ratings: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
    },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }]
}, { timestamps: true });

productSchema.virtual('discount').get(function () {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
