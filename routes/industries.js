const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');


router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(`
            SELECT code, name
            FROM industries
        `);

        return res.json({industries: results.rows});
    }
    catch (err) {
        return next(err);
    }
});

router.post('/', async function(req, res, next) {
    try {
        const { code, name } = req.body;
        
        const result = await db.query(`
            INSERT INTO industries (code, name)
            VALUES ($1, $2)
            RETURNING code, name`,
            [code, name]
        );

        return res.status(201).json({ industry: result.rows[0] });
    }
    catch (err) {
        return next(err);
    }
});

router.get('/:code', async function(req, res, next) {
    try {
        const { code } = req.params;

        const indResult = await db.query(`
            SELECT * 
            FROM industries
            WHERE code=$1`,
            [code]
        );

        if(indResult.rows.length === 0) {
            throw new ExpressError(`Industry ${code} not found`, 404);
        }

        const compResult = await db.query(`
            SELECT c.name
            FROM companies AS c
            JOIN companies_industries AS ci
            ON c.code=ci.comp_code
            WHERE ci.ind_code=$1`,
            [code]
        );

        const industry = indResult.rows[0];
        const companies = compResult.rows;

        industry.companies = companies.map(comp => comp.name);
        
        return res.json({ industry: industry });
    }
    catch (err) {
        return next(err);
    }
});


module.exports = router;