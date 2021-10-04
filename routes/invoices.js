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
        const { comp_code, amt } = req.body;
        console.log('inside post route before result');
        const result = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt]
        );
        console.log('inside post route after result');
        
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
            throw new ExpressError(`Invoice #${req.params.id} not found`, 404);
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
        const { amt, paid } = req.body;
        let paidDate = null;
        let id = req.params.id;

        const inv = await db.query(`
            SELECT paid
            FROM invoices
            WHERE id=$1`,
            [id]
        );
        
        if(inv.rows.length === 0) {
            throw new ExpressError(`Invoice #${id} not found`, 404);
        }

        let currPaidDate = inv.rows[0].paid_date;

        if(!currPaidDate && paid) {
            paidDate = new Date();
        }

        else if(!paid) {
            paidDate = null;
        }
        else {
            paidDate = currPaidDate;
        }

        const result = await db.query(`
            UPDATE invoices
            SET amt=$1, paid=$2, paid_date=$3 
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]
        );

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