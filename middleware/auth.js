const isLoggedIn = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error', 'You must be logged in to access this page.');
    res.redirect('/auth/login');
};

const isAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    req.flash('error', 'Access denied. Admin only.');
    res.redirect('/');
};

module.exports = { isLoggedIn, isAdmin };
