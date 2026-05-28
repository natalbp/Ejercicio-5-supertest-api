const request = require('supertest');
const { app, resetContacts } = require('../src/app.js');

beforeEach(() => {
  resetContacts();
});


describe('Contacts API', () => {

  describe('GET /api/contacts', () => {
    it('1. devuelve status 200 y un array', async () => {
      const res = await request(app).get('/api/contacts');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });


  describe('GET /api/contacts/:id', () => {
    it('2. devuelve el contacto correcto', async () => {
      const res = await request(app).get('/api/contacts/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 1, name: 'Pepito Perez', email: 'pepito@example.com' });
    });

    it('3. devuelve 404 para un ID inexistente', async () => {
      const res = await request(app).get('/api/contacts/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  
  describe('POST /api/contacts', () => {
    it('4. crea el contacto y devuelve 201 con el objeto creado', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Milo J', email: 'milo@example.com', phone: '555-666-7777' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Milo J', email: 'milo@example.com' });
      expect(res.body.id).toBeDefined();
    });

    it('5. devuelve 400 si falta el name', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ email: 'sin-nombre@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/name/i);
    });

    it('6. devuelve 400 si el email no tiene @', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Sin Arroba', email: 'emailsinArroba.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });
  });

 
  describe('PUT /api/contacts/:id', () => {
    it('7. actualiza correctamente los campos enviados', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ phone: '999-999-9999' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 1, name: 'Pepito Perez', phone: '999-999-9999' });
    });

    it('devuelve 404 si el contacto no existe', async () => {
      const res = await request(app)
        .put('/api/contacts/999')
        .send({ phone: '000-000-0000' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });


  describe('DELETE /api/contacts/:id', () => {
    it('8. elimina el contacto y devuelve confirmación', async () => {
      const res = await request(app).delete('/api/contacts/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');

      // Verificar que ya no existe
      const check = await request(app).get('/api/contacts/1');
      expect(check.status).toBe(404);
    });

    it('9. devuelve 404 para ID inexistente', async () => {
      const res = await request(app).delete('/api/contacts/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

});