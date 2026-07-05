import request from 'supertest';
import { initDb, closeDb } from '../../src/db';
import { createApp } from '../../src/app';
import { Application } from 'express';

let app: Application;

beforeAll(() => {
  initDb(':memory:');
  app = createApp();
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  // Clear todos table between tests for isolation
  const { getDb } = require('../../src/db');
  getDb().exec('DELETE FROM todos');
});

describe('GET /todos', () => {
  it('returns 200 with empty array when no todos', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns all todos ordered by createdAt DESC', async () => {
    await request(app).post('/todos').send({ title: 'First' }).set('Content-Type', 'application/json');
    await request(app).post('/todos').send({ title: 'Second' }).set('Content-Type', 'application/json');
    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Most recently created is first
    expect(res.body[0].title).toBe('Second');
    expect(res.body[1].title).toBe('First');
  });
});

describe('POST /todos', () => {
  it('creates a todo and returns 201 with full item', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Buy milk', description: 'Whole milk', completed: false });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Buy milk');
    expect(res.body.description).toBe('Whole milk');
    expect(res.body.completed).toBe(false);
    expect(res.body.createdAt).toBeDefined();
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('defaults completed to false when not provided', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Default completed' });
    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(false);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ description: 'No title here' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when title exceeds 255 characters', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'a'.repeat(256) });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send('{ bad json }');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 415 for wrong Content-Type', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'text/plain')
      .send('title=hello');
    expect(res.status).toBe(415);
  });
});

describe('GET /todos/:id', () => {
  it('returns 200 with the todo', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Get me' });
    const res = await request(app).get(`/todos/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.title).toBe('Get me');
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/todos/999999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('PATCH /todos/:id', () => {
  it('updates title and returns 200 with updated item', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Old title' });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Content-Type', 'application/json')
      .send({ title: 'New title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New title');
  });

  it('toggles completed status', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Toggle me' });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Content-Type', 'application/json')
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('preserves untouched fields', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Original', description: 'Keep me' });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Content-Type', 'application/json')
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Original');
    expect(res.body.description).toBe('Keep me');
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app)
      .patch('/todos/999999')
      .set('Content-Type', 'application/json')
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 for empty body', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Existing' });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for empty title', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Has title' });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Content-Type', 'application/json')
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('returns 415 for wrong Content-Type', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'CT test' });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Content-Type', 'text/plain')
      .send('title=x');
    expect(res.status).toBe(415);
  });
});

describe('DELETE /todos/:id', () => {
  it('deletes todo and returns 200 with id', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Delete me' });
    const res = await request(app).delete(`/todos/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('deleted todo no longer appears in list', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Gone' });
    await request(app).delete(`/todos/${created.body.id}`);
    const list = await request(app).get('/todos');
    expect(list.body.find((t: { id: number }) => t.id === created.body.id)).toBeUndefined();
  });

  it('deleted todo returns 404 on direct GET', async () => {
    const created = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({ title: 'Vanish' });
    await request(app).delete(`/todos/${created.body.id}`);
    const res = await request(app).get(`/todos/${created.body.id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).delete('/todos/999999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('Undefined routes', () => {
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('Content-Type header on all responses', () => {
  it('includes application/json on 200 responses', async () => {
    const res = await request(app).get('/todos');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('includes application/json on 404 responses', async () => {
    const res = await request(app).get('/todos/999999');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('includes application/json on 400 responses', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
