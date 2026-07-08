const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
    try {
        const { search, category, sort, minPrice, maxPrice } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort === 'name_asc') sortOption = { name: 1 };
        else if (sort === 'rating') sortOption = { 'ratings.average': -1 };

        const products = await Product.find(query).sort(sortOption);
        const categories = ['All', 'Handbags', 'Backpacks', 'Clutches', 'Tote Bags', 'Shoulder Bags', 'Travel Bags', 'Wallets', 'Other'];

        res.render('products/index', {
            title: 'Shop — Raju Bag House',
            products,
            categories,
            currentCategory: category || 'All',
            search: search || '',
            sort: sort || '',
            minPrice: minPrice || '',
            maxPrice: maxPrice || ''
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load products.');
        res.redirect('/');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/products');
        }

        const related = await Product.find({
            category: product.category,
            _id: { $ne: product._id }
        }).limit(4);

        res.render('products/show', {
            title: `${product.name} — Raju Bag House`,
            product,
            related
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Product not found.');
        res.redirect('/products');
    }
});

module.exports = router;
