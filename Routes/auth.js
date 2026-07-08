const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /auth/login
router.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('auth/login', { title: 'Login — Raju Bag House' });
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            req.flash('error', 'Please fill in all fields.');
            return res.redirect('/auth/login');
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/auth/login');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/auth/login');
        }

        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.role = user.role;

        req.flash('success', `Welcome back, ${user.name}! 🎉`);

        if (user.role === 'admin') {
            return res.redirect('/admin');
        }
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/auth/login');
    }
});

// GET /auth/register
router.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('auth/register', { title: 'Register — Raju Bag House' });
});

// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            req.flash('error', 'Please fill in all fields.');
            return res.redirect('/auth/register');
        }

        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect('/auth/register');
        }

        if (password.length < 6) {
            req.flash('error', 'Password must be at least 6 characters.');
            return res.redirect('/auth/register');
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            req.flash('error', 'An account with this email already exists.');
            return res.redirect('/auth/register');
        }

        const user = new User({ name, email, password });
        await user.save();

        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.role = user.role;

        req.flash('success', `Welcome to Raju Bag House, ${user.name}! 🛍️`);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Registration failed. Please try again.');
        res.redirect('/auth/register');
    }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

module.exports = router;
