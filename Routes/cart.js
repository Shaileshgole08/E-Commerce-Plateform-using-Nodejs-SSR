const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('cart.product');
        const cartItems = user.cart.filter(item => item.product);
        const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const shipping = subtotal > 999 ? 0 : 99;
        const total = subtotal + shipping;

        res.render('cart/index', {
            title: 'Shopping Cart — Raju Bag House',
            cartItems,
            subtotal,
            shipping,
            total
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load cart.');
        res.redirect('/');
    }
});

router.post('/:id', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.id;
        const quantity = parseInt(req.body.quantity) || 1;

        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/products');
        }

        if (product.stock < quantity) {
            req.flash('error', 'Not enough stock available.');
            return res.redirect(`/products/${productId}`);
        }

        const user = await User.findById(req.session.userId);
        const existingItem = user.cart.find(item => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({ product: productId, quantity });
        }

        await user.save();
        req.flash('success', `${product.name} added to cart! 🛒`);
        res.redirect('/products/' + productId);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to add to cart.');
        res.redirect('/products');
    }
});

router.patch('/:id', isLoggedIn, async (req, res) => {
    try {
        const { quantity } = req.body;
        const user = await User.findById(req.session.userId);
        const item = user.cart.find(item => item.product.toString() === req.params.id);

        if (item) {
            item.quantity = Math.max(1, parseInt(quantity));
        }

        await user.save();
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to update cart.');
        res.redirect('/cart');
    }
});

router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        user.cart = user.cart.filter(item => item.product.toString() !== req.params.id);
        await user.save();
        req.flash('success', 'Item removed from cart.');
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to remove item.');
        res.redirect('/cart');
    }
});

router.post('/wishlist/:id', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.id;
        const user = await User.findById(req.session.userId);
        const inWishlist = user.wishlist.includes(productId);

        if (inWishlist) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
            req.flash('success', 'Removed from wishlist.');
        } else {
            user.wishlist.push(productId);
            req.flash('success', 'Added to wishlist! ❤️');
        }

        await user.save();
        res.redirect(req.headers.referer || '/products');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to update wishlist.');
        res.redirect(req.headers.referer || '/products');
    }
});

module.exports = router;
