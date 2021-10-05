process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');


let testCompany;
let testIndustry;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple', 'Maker of the iPhone')
    RETURNING code, name, description
    `);

    testCompany = result.rows[0];

    let industry = await db.query(`
    INSERT INTO industries (code, name)
    VALUES ('tech', 'Technology')
    RETURNING code, name
    `);

    testIndustry = industry.rows[0];
});

afterEach(async () => {
    await db.query(`
    DELETE FROM companies
    `);

    await db.query(`
    DELETE FROM industries
    `);
});

afterAll(async () => {
    await db.end();
});


describe('GET /industries', () => {
    test('GET all industries', async () => {
        const res = await request(app).get(`/industries`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({industries: [{code: 'tech', name: 'Technology'}]});
    });
});

describe('GET /industries/:code', () => {
    test('GET single industry', async () => {
        const res = await request(app).get(`/industries/${testIndustry.code}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({industry: {code: testIndustry.code, name: testIndustry.name, companies: []}});
    });

    test("Responds with 404 with invalid industry code", async function() {
        const response = await request(app).get(`/companies/jhiklj`);
        expect(response.statusCode).toBe(404);
    });
});

describe('POST /industries', () => {
    test('Creates new industry', async () => {
        const res = await request(app)
            .post(`/industries`)
            .send({
                code: 'fin',
                name: 'Financial'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({industry: {code: 'fin', name: 'Financial'}});
    });
});