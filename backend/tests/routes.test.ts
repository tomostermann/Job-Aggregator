import request from 'supertest';
import express from 'express';

import { listOffers, getOffer, postOffer  } from '../src/offers/offers.controler';

const app = express();
app.use(express.json());
app.get('/offers', listOffers);
app.get('/offers/:id', getOffer);
app.post('/offers', postOffer);

const { getOffers, getOfferById } = jest.requireMock('../src/offers/offers.service');

jest.mock('../src/offers/offers.service', () => ({
  getOffers: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  getOfferById: jest.fn().mockResolvedValue({ id: '1', title: 'Test Job' }),
  createOffer: jest.fn().mockResolvedValue({ id: '2', title: 'Dev Backend' }),
}));

describe('API Routes', () => {


  test('GET /offers retourne 200', async () => {
    const res = await request(app).get('/offers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  test('GET /offers retourne 500 si le service throw', async () => {
    getOffers.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).get('/offers');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });


  test('GET /offers/:id retourne 200', async () => {
    const res = await request(app).get('/offers/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Job');
  });

  test('GET /offers/:id retourne 404 si introuvable', async () => {
    getOfferById.mockResolvedValueOnce(null);
    const res = await request(app).get('/offers/inexistant');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });


  test('POST /offers retourne 201 avec body valide', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ title: 'Dev Backend', company: 'Acme' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Dev Backend');
  });

  test('POST /offers retourne 400 si titre trop court', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ title: 'Dev' }); 
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /offers retourne 400 si titre absent', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ company: 'Acme' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});