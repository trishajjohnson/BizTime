const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');


router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(`
        SELECT id, comp_Code
        FROM invoices
        `);

        return res.json({ invoices: results.rows });
    }
    catch (err) {
        return next(err);
    }
});

router.post('/', async function(req, res, next) {
    try {
        const { comp_Code, amt } = req.body;

        const result = await db.query(`
        INSERT INTO invoices (comp_Code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_Code, amt, paid, add_date, paid_date`,
        [comp_Code, amt]
        );

        return res.status(201).json({ invoice: result.rows[0] });
    }
    catch (err) {
        return next(err);
    }
});

router.get('/:id', async function(req, res, next) {
    try {
        const result = await db.query(`
        SELECT i.id, 
               i.amt, 
               i.paid, 
               i.add_date, 
               i.paid_date, 
               c.code, 
               c.name, 
               c.description
        FROM invoices AS i
        JOIN companies AS c
        ON i.comp_Code=c.code
        WHERE id=$1`,
        [req.params.id]
        );

        if(result.rows.length === 0) {
            throw new ExpressError(`Invoice #${req.params.id} does not exist`, 404);
        }

        const data = result.rows[0];
        const invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.code,
                name: data.name,
                description: data.description
            }
        }
        return res.json({"invoice": invoice });
    }
    catch (err) {
        return next(err);
    }
});

router.put('/:id', async function(req, res, next) {
    try {
        const { amt } = req.body;
        const result = await db.query(`
        UPDATE invoices
        SET amt=$1
        WHERE id=$2
        RETURNING id, comp_Code, amt, paid, add_date, paid_date`,
        [amt, req.params.id]
        );

        if(result.rows.length === 0) {
            throw new ExpressError(`Invoice #${req.params.id} not found`, 404);
        }

        return res.json({ invoice: result.rows[0] });
    }
    catch (err) {
        return next(err);
    }
});

router.delete('/:id', async function(req, res, next) {
    try {
        const result = await db.query(`
        DELETE 
        FROM invoices
        WHERE id=$1
        RETURNING id`,
        [req.params.id]
        );

        if(result.rows.length === 0) {
            throw new ExpressError(`Invoice #${req.params.id} not found`, 404);
        }

        return res.json({status: "deleted"});
    }
    catch (err) {
        return next(err);
    }
});


module.exports = router;