const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');
const slugify = require('slugify');


router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(`
            SELECT code, name
            FROM companies
        `);

        return res.json({companies: results.rows});
    }
    catch (err) {
        return next(err);
    }
});

router.post('/', async function(req, res, next) {
    try {
        const { name, description } = req.body;
        const code = slugify(name, {replacement: '', lower: true});
        
        const result = await db.query(`
            INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json({company: result.rows[0]});
    }
    catch (err) {
        return next(err);
    }
});

router.get('/:code', async function(req, res, next) {
    try {
        const { code } = req.params;

        const compResult = await db.query(`
            SELECT * 
            FROM companies
            WHERE code=$1`,
            [code]
        );

        if(compResult.rows.length === 0) {
            throw new ExpressError(`Company ${code} not found`, 404);
        }

        const invResult = await db.query(`
            SELECT *
            FROM invoices
            WHERE comp_code=$1`,
            [code]
        );

        const indResults = await db.query(`
            SELECT i.name
            FROM industries AS i
            JOIN companies_industries AS ci
            ON i.code=ci.ind_code
            WHERE ci.comp_code=$1`,
            [code]
        );

        const invoices = invResult.rows;
        const industries = indResults.rows;
        const company = compResult.rows[0];

        company.invoices = invoices.map(inv => inv.id);
        company.industries = industries.map(ind => ind.name);

        return res.json({ company: company });
    }
    catch (err) {
        return next(err);
    }
});

router.put('/:code', async function(req, res, next) {
    try {
        const { name, description } = req.body;

        const result = await db.query(`
            UPDATE companies
            SET name=$1, description=$2
            WHERE code=$3
            RETURNING *`,
            [name, description, req.params.code]
        );

        if(result.rows.length === 0) {
            throw new ExpressError(`Company ${req.params.code} not found`, 404);
        }

        return res.json({company: result.rows[0]});
    }
    catch (err) {
        return next(err);
    }
});

router.delete('/:code', async function(req, res, next) {
    try {

        const { code } = req.params;

        const company = await db.query(`
            SELECT * 
            FROM companies
            WHERE code=$1`,
            [code]
        );

        if(company.rows.length === 0) {
            throw new ExpressError(`Company ${code} not found`, 404);
        }

        const result = await db.query(`
            DELETE 
            FROM companies
            WHERE code=$1`,
            [code]
        );

        return res.json({ status: "deleted" });
    }
    catch (err) {
        return next(err);
    }
});


module.exports = router;