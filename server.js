const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Раздача статических файлов
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/locales', express.static(path.join(__dirname, 'assets/locales')));


// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Проверка наличия изображений
const imgPath = path.join(__dirname, 'assets', 'img');
console.log('Проверка изображений в:', imgPath);

fs.readdir(imgPath, (err, files) => {
  if (err) {
    console.error('Ошибка чтения директории изображений:', err);
  } else {
    console.log('Доступные изображения:', files);
  }
});

// Памятная "База данных"
const users = [
  {
    id: 1,
    email: 'admin@chem.kz',
    password: '$2a$10$XlzY7E2d5O0EwZ7q8PzZKeQYQYQYQYQYQYQYQYQYQYQYQYQ', // admin123
    name: 'Администратор',
    role: 'admin'
  }
];

// Моковые данные товаров для тестирования
let products = [
  {
    id: 1,
    name: "Ацетон",
    price: 1500,
    category: "lab-chem",
    availability: "in_stock",
    image: "/assets/img/acetone.jpg"
  },
  {
    id: 2,
    name: "Соляная кислота",
    price: 2000,
    category: "lab-chem",
    availability: "in_stock",
    image: "/assets/img/hcl.jpg"
  },
  {
    id: 3,
    name: "Полипропилен",
    price: 5000,
    category: "poly",
    availability: "in_stock",
    image: "/assets/img/polypropylene.jpg"
  },
  {
    id: 4,
    name: "Этиловый спирт",
    price: 1800,
    category: "lab-chem",
    availability: "in_stock",
    image: "/assets/img/ethanol.jpg"
  },
  {
    id: 5,
    name: "Полиэтилен",
    price: 4500,
    category: "poly",
    availability: "in_stock",
    image: "/assets/img/polyethylene.jpg"
  }
];

const sellers = [];

// Middleware авторизации
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = users.find(u => u.id === parseInt(token));
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Регистрация
app.post('/api/register', async (req, res) => {
  const { email, password, isSeller, companyData } = req.body;
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    email,
    password: hashedPassword,
    name: email.split('@')[0],
    role: isSeller ? 'seller' : 'user',
    ...(isSeller && { companyData })
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// Вход
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

// Получение текущего пользователя
app.get('/api/me', authenticate, (req, res) => {
  res.json(req.user);
});

// API для получения товаров с фильтрацией по категории
app.get('/api/products', (req, res) => {
  const category = req.query.category;
  
  if (category) {
    const filteredProducts = products.filter(p => p.category === category);
    return res.json(filteredProducts);
  }
  
  res.json(products);
});

app.post('/api/products', authenticate, (req, res) => {
  const newProduct = {
    id: products.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Продавцы
app.post('/api/sellers', authenticate, (req, res) => {
  const seller = {
    id: sellers.length + 1,
    userId: req.user.id,
    ...req.body,
    rating: 0,
    products: []
  };
  sellers.push(seller);
  res.status(201).json(seller);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});