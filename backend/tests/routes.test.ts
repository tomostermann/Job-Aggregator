import request from 'supertest';
import express from 'express';

import { listOffers, getOffer } from '../src/offers/offers.controler'; 

const app = express();
app.use(express.json());
app.get('/offers', listOffers);
app.get('/offers/:id', getOffer);


jest.mock('../src/offers/offers.service', () => ({
  getOffers: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  getOfferById: jest.fn().mockResolvedValue({ id: '1', title: 'Test Job' })
}));

describe('API Routes', () => {
  test('GET /offers retourne 200', async () => {
    const res = await request(app).get('/offers');
    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty('data');
  });

  test('GET /offers/:id retourne 200', async () => {
    const res = await request(app).get('/offers/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Job');
  });
});