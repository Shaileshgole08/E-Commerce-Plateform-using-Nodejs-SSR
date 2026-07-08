const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/images/products');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only image files are allowed!'));
    }
});

// GET /admin — Dashboard
router.get('/', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const [totalProducts, totalOrders, totalUsers, orders] = await Promise.all([
            Product.countDocuments(),
            Order.countDocuments(),
            User.countDocuments({ role: 'user' }),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email')
        ]);

        const revenueData = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalRevenue = revenueData[0]?.total || 0;

        res.render('admin/dashboard', {
            title: 'Admin Dashboard — Raju Bag House',
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            recentOrders: orders
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load dashboard.');
        res.redirect('/');
    }
});

// GET /admin/products
router.get('/products', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('admin/products', {
            title: 'Manage Products — Admin',
            products
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load products.');
        res.redirect('/admin');
    }
});

// GET /admin/products/new
router.get('/products/new', isLoggedIn, isAdmin, (req, res) => {
    const categories = ['Handbags', 'Backpacks', 'Clutches', 'Tote Bags', 'Shoulder Bags', 'Travel Bags', 'Wallets', 'Other'];
    res.render('admin/newProduct', {
        title: 'Add Product — Admin',
        categories
    });
});

// POST /admin/products — Create product
router.post('/products', isLoggedIn, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, originalPrice, category, stock, material, brand, colors, sizes, tags, isFeatured } = req.body;

        const images = req.files && req.files.length > 0
            ? req.files.map(f => '/images/products/' + f.filename)
            : ['/images/bag-placeholder.svg'];

        const product = new Product({
            name,
            description,
            price: Number(price),
            originalPrice: Number(originalPrice) || 0,
            category,
            stock: Number(stock),
            material: material || '',
            brand: brand || 'Raju Bag House',
            colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [],
            sizes: sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            images,
            isFeatured: isFeatured === 'on'
        });

        await product.save();
        req.flash('success', `Product "${product.name}" created successfully! ✅`);
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to create product: ' + err.message);
        res.redirect('/admin/products/new');
    }
});

// GET /admin/products/:id/edit
router.get('/products/:id/edit', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }
        const categories = ['Handbags', 'Backpacks', 'Clutches', 'Tote Bags', 'Shoulder Bags', 'Travel Bags', 'Wallets', 'Other'];
        res.render('admin/editProduct', {
            title: 'Edit Product — Admin',
            product,
            categories
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load product.');
        res.redirect('/admin/products');
    }
});

// PUT /admin/products/:id — Update product
router.put('/products/:id', isLoggedIn, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, originalPrice, category, stock, material, brand, colors, sizes, tags, isFeatured, keepImages } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        let images = product.images;
        if (req.files && req.files.length > 0) {
            images = req.files.map(f => '/images/products/' + f.filename);
        }

        product.name = name;
        product.description = description;
        product.price = Number(price);
        product.originalPrice = Number(originalPrice) || 0;
        product.category = category;
        product.stock = Number(stock);
        product.material = material || '';
        product.brand = brand || 'Raju Bag House';
        product.colors = colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [];
        product.sizes = sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
        product.tags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        product.images = images;
        product.isFeatured = isFeatured === 'on';

        await product.save();
        req.flash('success', `Product "${product.name}" updated successfully! ✅`);
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to update product: ' + err.message);
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
});

// DELETE /admin/products/:id — Delete product
router.delete('/products/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }
        req.flash('success', `Product "${product.name}" deleted successfully.`);
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to delete product.');
        res.redirect('/admin/products');
    }
});

// GET /admin/orders
router.get('/orders', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.render('admin/orders', {
            title: 'All Orders — Admin',
            orders
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load orders.');
        res.redirect('/admin');
    }
});

// PATCH /admin/orders/:id/status — Update order status
router.patch('/orders/:id/status', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        req.flash('success', 'Order status updated.');
        res.redirect('/admin/orders');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to update order status.');
        res.redirect('/admin/orders');
    }
});

module.exports = router;
