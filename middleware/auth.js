// Middleware: Check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error', 'You must be logged in to access this page.');
    res.redirect('/auth/login');
};

// Middleware: Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    req.flash('error', 'Access denied. Admin only.');
    res.redirect('/');
};

module.exports = { isLoggedIn, isAdmin };
