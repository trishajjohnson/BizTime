process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');


let testCompany;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('wholefoodsmarket', 'Whole Foods Market', 'Natural Foods Grocery Store')
    RETURNING code, name, description
    `);

    testCompany = result.rows[0];
});

afterEach(async () => {
    await db.query(`
    DELETE FROM companies
    `);
});

afterAll(async () => {
    await db.end();
});


describe('GET /companies', () => {
    test('GET all companies', async () => {
        const res = await request(app).get(`/companies`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({companies: [{code: 'wholefoodsmarket', name: 'Whole Foods Market'}]});
    });
});

describe('GET /companies/:code', () => {
    test('GET single company', async () => {
        const res = await request(app).get(`/companies/wholefoodsmarket`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({company: {code: 'wholefoodsmarket', name: 'Whole Foods Market', description: 'Natural Foods Grocery Store', invoices: [], industries: []}});
    });

    test("Responds with 404 with invalid code", async function() {
        const response = await request(app).get(`/companies/jhiklj`);
        expect(response.statusCode).toBe(404);
    });
});

describe('POST /companies', () => {
    test('Creates new company', async () => {
        const res = await request(app)
            .post(`/companies`)
            .send({
                name: 'Apple',
                description: 'Maker of the iPhone'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({company: {code: 'apple', description: 'Maker of the iPhone', name: 'Apple'}});
    });
});

describe('PUT /companies/:code', () => {
    test('Updates single company', async () => {
        const res = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({
                name: 'Whole Foods Grocery',
                description: 'Natural Foods Grocery Store'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({company: {code: 'wholefoodsmarket', name: 'Whole Foods Grocery', description: 'Natural Foods Grocery Store'}});
    });

    test("Responds with 404 with invalid company code", async function() {
        const response = await request(app).put(`/companies/jhiklj`);
        expect(response.statusCode).toBe(404);
    });
});

describe('DELETE /companies/:code', () => {
    test('Deletes single company', async () => {

        const res = await request(app).delete(`/companies/${testCompany.code}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"});
    });

    test("Responds with 404 with invalid code", async function() {
        const response = await request(app).delete(`/companies/jhiklj`);
        expect(response.statusCode).toBe(404);
    });
});

