const express = require('express');
const app = express();
const ejsmate = require('ejs-mate');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const authRoutes = require('./Routes/auth');
const productRoutes = require('./Routes/products');
const cartRoutes = require('./Routes/cart');
const orderRoutes = require('./Routes/orders');
const adminRoutes = require('./Routes/admin');

const User = require('./models/User');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/rajubaghouse')
    .then(() => console.log('✅ MongoDB connected to rajubaghouse'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

app.use(session({
    secret: 'rajubaghouse_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));

app.use(flash());

app.use(async (req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = null;
    res.locals.cartCount = 0;

    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId).select('name email role cart wishlist');
            res.locals.currentUser = user;
            res.locals.cartCount = user ? user.cart.length : 0;
        } catch (e) {}
    }
    next();
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);

app.get('/', async (req, res) => {
    try {
        const featured = await Product.find({ isFeatured: true }).limit(8);
        const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(8);
        const categories = ['Handbags', 'Backpacks', 'Clutches', 'Tote Bags', 'Shoulder Bags', 'Travel Bags'];
        res.render('Home', { title: 'Raju Bag House — Premium Bags', featured, newArrivals, categories });
    } catch (err) {
        console.error(err);
        res.render('Home', { title: 'Raju Bag House — Premium Bags', featured: [], newArrivals: [], categories: [] });
    }
});

async function seedAdmin() {
    try {
        const existing = await User.findOne({ email: 'shailesh@admin.com' });
        if (!existing) {
            const admin = new User({
                name: 'Admin Shailesh',
                email: 'shailesh@admin.com',
                password: 'Admin@123',
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Admin user created: shailesh@admin.com / Admin@123');
        }
    } catch (err) {
        console.error('Admin seed error:', err);
    }
}

mongoose.connection.once('open', seedAdmin);

app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found — Raju Bag House' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (req.flash) req.flash('error', err.message || 'Something went wrong!');
    const referer = req.headers.referer || '/';
    res.redirect(referer);
});

app.listen(3000, () => {
    console.log('🚀 Raju Bag House running at http://localhost:3000/');
});