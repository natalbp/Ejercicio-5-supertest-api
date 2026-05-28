const express = require('express');
const app = express();
app.use(express.json());

let contacts = [
  { id: 1, name: 'Pepito Perez',   email: 'pepito@example.com',   phone: '111-111-1111' },
  { id: 2, name: 'Pablito Pablo',   email: 'pablito@example.com',  phone: '222-222-2222' },
];
let nextId = 3;

function resetContacts() {
  contacts = [
    { id: 1, name: 'Pepito Perez',  email: 'pepito@example.com',  phone: '111-111-1111' },
    { id: 2, name: 'Pablito Pablo',  email: 'pablito@example.com', phone: '222-222-2222' },
  ];
  nextId = 3;
}

// Todos los contactos
app.get('/api/contacts', (req, res) => {
  res.json(contacts);
});

// Contacto por ID
app.get('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ error: 'Contacto no encontrado.' });
  res.json(contact);
});

// Crear contacto
app.post('/api/contacts', (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El campo name es requerido.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'El campo email es requerido y debe contener @.' });
  }

  const newContact = { id: nextId++, name: name.trim(), email: email.trim(), phone: phone || null };
  contacts.push(newContact);
  res.status(201).json(newContact);
});

// Actualizar contacto
app.put('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ error: 'Contacto no encontrado.' });

  Object.assign(contact, req.body);
  res.json(contact);
});

// Eliminar contacto
app.delete('/api/contacts/:id', (req, res) => {
  const index = contacts.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Contacto no encontrado.' });

  contacts.splice(index, 1);
  res.json({ message: 'Contacto eliminado.' });
});

module.exports = { app, resetContacts };