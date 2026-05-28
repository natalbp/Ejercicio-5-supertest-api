const express = require('express');
const app = express();

app.use(express.json());

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Datos iniciales
let contacts = [
  {
    id: 1,
    name: 'Pepito',
    email: 'Pepito@example.com',
    phone: '111-111-1111',
    favorite: false,
    createdAt: '2024-01-10T08:00:00.000Z'
  },
  {
    id: 2,
    name: 'Pablito Pablo',
    email: 'pablito@example.com',
    phone: '222-222-2222',
    favorite: true,
    createdAt: '2024-01-11T09:00:00.000Z'
  },
  {
    id: 3,
    name: 'Maria Lopez',
    email: 'maria@example.com',
    phone: null,
    favorite: false,
    createdAt: '2024-01-12T10:00:00.000Z'
  }
];

let nextId = 4;



function resetContacts() {
  contacts = [
    {
      id: 1,
      name: 'Pepito',
      email: 'Pepito@example.com',
      phone: '111-111-1111',
      favorite: false,
      createdAt: '2024-01-10T08:00:00.000Z'
    },
    {
      id: 2,
      name: 'Pablito Pablo',
      email: 'pablito@example.com',
      phone: '222-222-2222',
      favorite: true,
      createdAt: '2024-01-11T09:00:00.000Z'
    },
    {
      id: 3,
      name: 'Maria Lopez',
      email: 'maria@example.com',
      phone: null,
      favorite: false,
      createdAt: '2024-01-12T10:00:00.000Z'
    }
  ];

  nextId = 4;
}


app.get('/api/contacts', (req, res) => {
  const { search, favorite } = req.query;

  let result = [...contacts];

  if (search) {
    const text = search.toLowerCase();

    result = result.filter(c =>
      c.name.toLowerCase().includes(text) ||
      c.email.toLowerCase().includes(text)
    );
  }

  if (favorite === 'true') {
    result = result.filter(c => c.favorite === true);
  }

  res.json(result);
});



app.get('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(
    c => c.id === Number(req.params.id)
  );

  if (!contact) {
    return res.status(404).json({
      status: 404,
      error: 'Contacto no encontrado.'
    });
  }

  res.json(contact);
});



app.post('/api/contacts', (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      status: 400,
      error: 'El campo name es requerido.'
    });
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      status: 400,
      error: 'Email inválido.'
    });
  }



  const duplicate = contacts.find(
    c => c.email.toLowerCase() === email.toLowerCase()
  );

  if (duplicate) {
    return res.status(409).json({
      status: 409,
      error: 'Ya existe un contacto con ese email.'
    });
  }

  const newContact = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    phone: phone || null,
    favorite: false,
    createdAt: new Date().toISOString()
  };

  contacts.push(newContact);

  res.status(201).json(newContact);
});



app.put('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(
    c => c.id === Number(req.params.id)
  );

  if (!contact) {
    return res.status(404).json({
      status: 404,
      error: 'Contacto no encontrado.'
    });
  }

  const { name, email, phone } = req.body;

  if (email !== undefined) {
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        status: 400,
        error: 'Email inválido.'
      });
    }

    const duplicate = contacts.find(
      c =>
        c.id !== contact.id &&
        c.email.toLowerCase() === email.toLowerCase()
    );

    if (duplicate) {
      return res.status(409).json({
        status: 409,
        error: 'Ya existe un contacto con ese email.'
      });
    }

    contact.email = email.trim();
  }

  if (name !== undefined) {
    contact.name = name.trim();
  }

  if (phone !== undefined) {
    contact.phone = phone || null;
  }

  res.json(contact);
});



app.patch('/api/contacts/:id/favorite', (req, res) => {
  const contact = contacts.find(
    c => c.id === Number(req.params.id)
  );

  if (!contact) {
    return res.status(404).json({
      status: 404,
      error: 'Contacto no encontrado.'
    });
  }

  contact.favorite = !contact.favorite;

  res.json(contact);
});



app.delete('/api/contacts/:id', (req, res) => {
  const index = contacts.findIndex(
    c => c.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      status: 404,
      error: 'Contacto no encontrado.'
    });
  }

  contacts.splice(index, 1);

  res.json({
    message: 'Contacto eliminado.'
  });
});



app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Ruta no encontrada.'
  });
});

module.exports = {
  app,
  resetContacts
};