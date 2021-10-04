process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');


let testCompany;
let testInvoice;

beforeEach(async () => {
    let company = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('wfm', 'Whole Foods Market', 'Natural Foods Grocery Store')
        RETURNING code, name, description
    `);

    testCompany = company.rows[0];

    let invoice = await db.query(`
        INSERT INTO invoices (comp_Code, amt)
        VALUES ('wfm', 300)
        RETURNING id, comp_Code, amt, paid, add_date, paid_date
    `);

    testInvoice = invoice.rows[0];
});

afterEach(async () => {
    await db.query(`
    DELETE FROM companies
    `);

    await db.query(`
    DELETE FROM invoices
    `);
});

afterAll(async () => {
    await db.end();
});


describe('GET /invoices', () => {
    test('GET all invoices', async () => {
        const res = await request(app).get(`/invoices`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoices: [{id: expect.any(Number), comp_code: 'wfm', amt: 300, paid: false,}]});
    });
});

