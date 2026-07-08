const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { isLoggedIn } = require('../middleware/auth');

router.get('/checkout', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('cart.product');
        const cartItems = user.cart.filter(item => item.product);

        if (cartItems.length === 0) {
            req.flash('error', 'Your cart is empty.');
            return res.redirect('/cart');
        }

        const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const shipping = subtotal > 999 ? 0 : 99;
        const total = subtotal + shipping;

        res.render('orders/checkout', {
            title: 'Checkout — Raju Bag House',
            cartItems,
            subtotal,
            shipping,
            total,
            address: user.address || {}
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load checkout.');
        res.redirect('/cart');
    }
});

router.post('/checkout', isLoggedIn, async (req, res) => {
    try {
        const { name, street, city, state, pincode, phone, paymentMethod } = req.body;

        if (!name || !street || !city || !state || !pincode || !phone) {
            req.flash('error', 'Please fill in all shipping details.');
            return res.redirect('/orders/checkout');
        }

        const user = await User.findById(req.session.userId).populate('cart.product');
        const cartItems = user.cart.filter(item => item.product);

        if (cartItems.length === 0) {
            req.flash('error', 'Your cart is empty.');
            return res.redirect('/cart');
        }

        const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const shipping = subtotal > 999 ? 0 : 99;
        const total = subtotal + shipping;

        const order = new Order({
            user: user._id,
            items: cartItems.map(item => ({
                product: item.product._id,
                name: item.product.name,
                image: item.product.images[0] || '/images/bag-placeholder.svg',
                price: item.product.price,
                quantity: item.quantity
            })),
            shippingAddress: { name, street, city, state, pincode, phone },
            paymentMethod: paymentMethod || 'COD',
            subtotal,
            shipping,
            total
        });

        await order.save();

        user.address = { street, city, state, pincode, phone };
        user.cart = [];
        await user.save();

        req.flash('success', `Order placed successfully! Order #${order.orderNumber} 🎉`);
        res.redirect('/orders');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to place order. Please try again.');
        res.redirect('/orders/checkout');
    }
});

router.get('/', isLoggedIn, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.session.userId })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.render('orders/history', {
            title: 'My Orders — Raju Bag House',
            orders
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load orders.');
        res.redirect('/');
    }
});

router.post('/buy-now/:id', isLoggedIn, async (req, res) => {
    try {
        const Product = require('../models/Product');
        const product = await Product.findById(req.params.id);
        if (!product || product.stock < 1) {
            req.flash('error', 'Product unavailable.');
            return res.redirect('/products');
        }
        const user = await User.findById(req.session.userId);
        const existing = user.cart.find(c => c.product.toString() === req.params.id);
        if (existing) {
            existing.quantity = 1;
        } else {
            user.cart.push({ product: req.params.id, quantity: 1 });
        }
        await user.save();
        res.redirect('/orders/checkout');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong.');
        res.redirect('/products');
    }
});

module.exports = router;
