const express = require('express');
const app = express();
const companyRoutes = require('./routes/companies');
const invoiceRoutes = require('./routes/invoices');
const industriesRoutes = require('./routes/industries');
const ExpressError = require('./expressError');

app.use(express.json());

app.use('/companies', companyRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/industries', industriesRoutes);

// 404 Error Handler 

app.use(function(req, res, next) {
    const err = new ExpressError('Not Found', 404);
    
    return next(err);
});

// Global Error Handler 

app.use(function(err, req, res, next) {
    console.log('inside 500 error')
    res.status(err.status || 500);

    return res.json({
        error: err,
    });
});

module.exports = app;