const request = require('supertest');
const { app, resetContacts } = require('../src/app');

beforeEach(() => {
  resetContacts();
});


describe('POST /api/contacts — validación de email', () => {
  it('devuelve 400 cuando el email es "@"', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: '@' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('devuelve 400 cuando el email es "usuario@" (sin dominio)', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'usuario@' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('devuelve 400 cuando el email es "@dominio.com" (sin usuario)', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: '@dominio.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('devuelve 400 cuando el email es "sin-arroba"', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'sin-arroba' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('devuelve 201 cuando el email tiene formato válido', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'usuario@dominio.com' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Test', email: 'usuario@dominio.com' });
  });
});



describe('POST /api/contacts — email duplicado', () => {
  it('devuelve 409 si el email ya existe', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Otra Pepito', email: 'Pepito@example.com' });

    expect(res.status).toBe(409);
  });

  it('el body del 409 tiene un campo error descriptivo', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Otra Pepito', email: 'Pepito@example.com' });

    expect(res.body).toHaveProperty('error');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  it('devuelve 409 aunque el email venga en mayúsculas (case-insensitive)', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ name: 'Otra Pepito', email: 'Pepito@EXAMPLE.COM' });

    expect(res.status).toBe(409);
  });

  it('después de un 409, el total de contactos no aumenta', async () => {
    await request(app)
      .post('/api/contacts')
      .send({ name: 'Otra Pepito', email: 'Pepito@example.com' });

    const listRes = await request(app).get('/api/contacts');
    expect(listRes.body).toHaveLength(3);
  });
});



describe('GET /api/contacts — búsqueda y filtros', () => {
  it('?search=Pepito devuelve solo contactos que contienen "Pepito"', async () => {
    const res = await request(app).get('/api/contacts').query({ search: 'Pepito' });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach(c => {
      const matchesName  = c.name.toLowerCase().includes('Pepito');
      const matchesEmail = c.email.toLowerCase().includes('Pepito');
      expect(matchesName || matchesEmail).toBe(true);
    });
  });

  it('?search=Pepito (mayúsculas) devuelve los mismos resultados (case-insensitive)', async () => {
    const lower = await request(app).get('/api/contacts').query({ search: 'Pepito' });
    const upper = await request(app).get('/api/contacts').query({ search: 'Pepito' });

    expect(upper.body).toEqual(lower.body);
  });

  it('?search=example devuelve todos los que tienen @example.com', async () => {
    const res = await request(app).get('/api/contacts').query({ search: 'example' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('?search=xyznoexiste devuelve un array vacío (no un 404)', async () => {
    const res = await request(app).get('/api/contacts').query({ search: 'xyznoexiste' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('?favorite=true devuelve solo contactos con favorite: true', async () => {
    const res = await request(app).get('/api/contacts').query({ favorite: 'true' });

    expect(res.status).toBe(200);
    expect(res.body.every(c => c.favorite)).toBe(true);
  });

  it('?favorite=true devuelve solo Pablito (el único favorito inicial)', async () => {
    const res = await request(app).get('/api/contacts').query({ favorite: 'true' });

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Pablito Pablo');
  });

  it('sin query params devuelve todos los contactos', async () => {
    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });
});



describe('PATCH /api/contacts/:id/favorite', () => {
  it('cambia favorite de false a true en Pepito (id=1)', async () => {
    const res = await request(app).patch('/api/contacts/1/favorite');

    expect(res.status).toBe(200);
    expect(res.body.favorite).toBe(true);
  });

  it('dos llamadas consecutivas regresan el valor original (toggle completo)', async () => {
    await request(app).patch('/api/contacts/1/favorite');
    const res = await request(app).patch('/api/contacts/1/favorite');

    expect(res.body.favorite).toBe(false);
  });

  it('cambia favorite de true a false en Pablito (id=2)', async () => {
    const res = await request(app).patch('/api/contacts/2/favorite');

    expect(res.status).toBe(200);
    expect(res.body.favorite).toBe(false);
  });

  it('devuelve 404 para un ID inexistente', async () => {
    const res = await request(app).patch('/api/contacts/999/favorite');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('el cambio persiste: un GET posterior refleja el nuevo estado', async () => {
    await request(app).patch('/api/contacts/1/favorite');

    const res = await request(app).get('/api/contacts/1');
    expect(res.body.favorite).toBe(true);
  });
});



describe('PUT /api/contacts/:id', () => {
  it('actualizar solo el name devuelve 200 con el nombre cambiado', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ name: 'Pepito González' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, name: 'Pepito González', email: 'Pepito@example.com' });
  });

  it('actualizar con email de formato inválido devuelve 400', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ email: 'no-es-un-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('actualizar con el email de otro contacto existente devuelve 409', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ email: 'Pablito@example.com' });

    expect(res.status).toBe(409);
  });

  it('actualizar con el mismo email del propio contacto devuelve 200', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ email: 'Pepito@example.com' });

    expect(res.status).toBe(200);
  });

  it('actualizar un ID inexistente devuelve 404', async () => {
    const res = await request(app)
      .put('/api/contacts/999')
      .send({ name: 'Fantasma' });

    expect(res.status).toBe(404);
  });
});



describe('Middleware de error', () => {
  it('GET a ruta inexistente devuelve 404 con Content-Type JSON', async () => {
    const res = await request(app)
      .get('/api/ruta-que-no-existe')
      .expect('Content-Type', /json/);

    expect(res.status).toBe(404);
  });

  it('la respuesta del 404 genérico tiene el campo error (no HTML)', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');

    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  it('los errores de negocio tienen el campo status con el código HTTP correcto', async () => {
    const not_found = await request(app).get('/api/contacts/9999');
    expect(not_found.body).toHaveProperty('status', 404);

    const bad_request = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'malformado' });
    expect(bad_request.body).toHaveProperty('status', 400);

    const conflict = await request(app)
      .post('/api/contacts')
      .send({ name: 'Test', email: 'Pepito@example.com' });
    expect(conflict.body).toHaveProperty('status', 409);
  });
});