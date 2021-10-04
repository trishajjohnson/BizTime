process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');


let testCompany;
let testInvoice;

beforeEach(async () => {
    let company = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('wholefoodsmarket', 'Whole Foods Market', 'Natural Foods Grocery Store')
        RETURNING code, name, description
    `);

    testCompany = company.rows[0];

    let invoice = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ('wholefoodsmarket', 300)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
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
        expect(res.body).toEqual({invoices: [{id: expect.any(Number), comp_code: 'wholefoodsmarket'}]});
    });
});

describe('POST /invoices', () => {
    test('Creates new invoice', async () => {
        const res = await request(app)
            .post(`/invoices`)
            .send({
                comp_code: 'wholefoodsmarket',
                amt: 1500
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({invoice: {id: expect.any(Number), comp_code: 'wholefoodsmarket', amt: 1500, paid: false, add_date: expect.any(String), paid_date: null}});
    });
});

describe('GET /invoices/:id', () => {
    test('Gets single invoice', async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoice: {id: testInvoice.id, amt: 300, paid: false, add_date: expect.any(String), paid_date: null, company: {code: testInvoice.comp_code, name: testCompany.name, description: testCompany.description}}});
    });

    test("Responds with 404 with invalid invoice id", async function() {
        const response = await request(app).get(`/invoices/0`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({error: {message: `Invoice #0 not found`, status: 404}});
    });
});

describe('PUT /invoices/:id', () => {
    test('Updates single invoice', async () => {
        const res = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({
                amt: 850,
                paid: false
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoice: {id: testInvoice.id, comp_code: testInvoice.comp_code, amt: 850, paid: false, add_date: expect.any(String), paid_date: null}});
    });

    test("Responds with 404 with invalid invoice id", async function() {
        const response = await request(app).put(`/invoices/0`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({error: {message: `Invoice #0 not found`, status: 404}});
    });
});

describe('DELETE /invoices/:id', () => {
    test('Deletes single invoice', async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"});
    });

    test("Responds with 404 with invalid invoice id", async function() {
        const response = await request(app).delete(`/invoices/0`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({error: {message: `Invoice #0 not found`, status: 404}});
    });
});

