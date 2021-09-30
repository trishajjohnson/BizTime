const express = require('express');
const app = express();
const companyRoutes = require('./routes/companies');
const ExpressError = require('./expressError');

app.use(express.json());

app.use('/companies', companyRoutes);

// 404 Error Handler 

app.use(function(req, res, next) {
    const err = new ExpressError('Not Found', 404);
    return next(err);
});

// Global Error Handler 

app.use(function(err, req, res, next) {
    res.status(err.status || 500);

    return res.json({
        error: err,
        message: err.message   
    });
});

module.exports = app;