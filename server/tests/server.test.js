const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server'); // We need to export app/server from server.js

// Setup and Teardown
beforeAll(async () => {
    // Optionally connect to a test database here if not using in-memory
});

afterAll(async () => {
    await mongoose.connection.close();
    if (server) server.close();
});

describe('Root Endpoint / Health Check', () => {
    it('should return 200 and a status ok', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });
});

describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown-route');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('message');
    });
});
