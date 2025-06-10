const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// 資料庫初始化
const db = new sqlite3.Database('./db.sqlite3', (err) => {
  if (err) {
    console.error('無法連接資料庫', err.message);
  } else {
    console.log('✅ 已連線到 SQLite 資料庫');

    // 建立 users 資料表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        nickname TEXT,
        phone TEXT,
        balance REAL DEFAULT 0
      )
    `);

    // 建立 items 資料表
    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        note TEXT,
        status TEXT NOT NULL
      )
    `);
  }
});

// 中介軟體
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 註冊
app.post('/register', (req, res) => {
  const { username, password, nickname, phone } = req.body;
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  const stmt = db.prepare('INSERT INTO users (username, password, nickname, phone, balance) VALUES (?, ?, ?, ?, ?)');
  stmt.run(username, hash, nickname, phone, 0, function (err) {
    if (err) {
      console.error('註冊失敗：', err.message);
      res.send('註冊失敗：帳號可能已存在。');
    } else {
      res.redirect('/login.html');
    }
  });
  stmt.finalize();
});

// 登入
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, hash], (err, row) => {
    if (err) {
      console.error('登入錯誤：', err.message);
      res.send('登入失敗，伺服器錯誤');
    } else if (row) {
      res.redirect('/main.html?user=' + encodeURIComponent(row.username));
    } else {
      res.send('登入失敗，帳號或密碼錯誤');
    }
  });
});

// 查詢餘額
app.get('/api/balance', (req, res) => {
  const username = req.query.user;
  if (!username) return res.status(400).json({ error: '缺少使用者參數' });

  db.get('SELECT balance FROM users WHERE username = ?', [username], (err, row) => {
    if (err || !row) {
      console.error('查詢餘額失敗', err);
      return res.status(500).json({ error: '查詢餘額失敗' });
    }
    res.json({ balance: row.balance });
  });
});

// 加值
app.post('/api/deposit', (req, res) => {
  const { username, amount } = req.body;
  if (!username || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: '無效的請求資料' });
  }

  const stmt = db.prepare('UPDATE users SET balance = balance + ? WHERE username = ?');
  stmt.run(amount, username, function (err) {
    if (err) {
      console.error('加值失敗', err);
      return res.status(500).json({ error: '加值失敗' });
    }

    db.get('SELECT balance FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return res.status(500).json({ error: '查詢餘額失敗' });
      res.json({ balance: row.balance });
    });
  });
});

// 提款
app.post('/api/withdraw', (req, res) => {
  const { username, amount } = req.body;
  if (!username || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: '無效的請求資料' });
  }

  db.get('SELECT balance FROM users WHERE username = ?', [username], (err, row) => {
    if (err || !row) return res.status(500).json({ error: '查詢餘額失敗' });
    if (row.balance < amount) return res.status(400).json({ error: '餘額不足' });

    const stmt = db.prepare('UPDATE users SET balance = balance - ? WHERE username = ?');
    stmt.run(amount, username, function (err) {
      if (err) return res.status(500).json({ error: '提款失敗' });

      db.get('SELECT balance FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return res.status(500).json({ error: '查詢餘額失敗' });
        res.json({ balance: row.balance });
      });
    });
  });
});

// 上架商品
app.post('/api/sell', (req, res) => {
  const { seller, name, price, quantity, note } = req.body;
  if (!seller || !name || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: '資料無效' });
  }

  const stmt = db.prepare('INSERT INTO items (seller, name, price, quantity, note, status) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(seller, name, price, quantity, note || '', 'available', function (err) {
    if (err) {
      console.error('商品上架失敗', err);
      return res.status(500).json({ error: '商品上架失敗' });
    }
    res.json({ success: true });
  });
});

// 刪除商品（軟刪除，改 status 為 deleted）
app.delete('/api/item/:id', (req, res) => {
const itemId = req.params.id;
if (!itemId) return res.status(400).json({ error: '缺少商品 ID' });

const stmt = db.prepare('UPDATE items SET status = ? WHERE id = ?');
stmt.run('deleted', itemId, function (err) {
if (err) {
console.error('刪除商品失敗', err);
return res.status(500).json({ error: '刪除商品失敗' });
}
res.json({ success: true });
});
});

// 查詢使用者上架商品
app.get('/api/items', (req, res) => {
  const seller = req.query.seller;
  if (!seller) return res.status(400).json({ error: '缺少 seller 參數' });

  db.all('SELECT id, name, price, quantity, note FROM items WHERE seller = ? AND status = "available"', [seller], (err, rows) => {
    if (err) {
      console.error('查詢商品失敗', err);
      return res.status(500).json({ error: '查詢商品失敗' });
    }
    res.json(rows);
  });
});

// 刪除商品
app.delete('/api/item/:id', (req, res) => {
  const itemId = req.params.id;
  db.run('DELETE FROM items WHERE id = ?', [itemId], function (err) {
    if (err) {
      console.error('刪除商品失敗：', err);
      return res.status(500).json({ error: '刪除商品失敗' });
    }
    res.json({ success: true });
  });
});

// 查詢所有使用者金額
app.get('/api/users', (req, res) => {
db.all('SELECT username, nickname, balance FROM users', [], (err, rows) => {
if (err) {
console.error('讀取使用者資料失敗：', err);
return res.status(500).json({ error: 'Database error' });
}
res.json(rows);
});
});

// 查詢所有可購買商品（非本人上架、狀態為 available）
app.get('/api/buyable', (req, res) => {
  db.all('SELECT id, name, price, quantity, note FROM items WHERE status = "available"', [], (err, rows) => {
    if (err) {
      console.error('查詢可購買商品失敗', err);
      return res.status(500).json({ error: '查詢失敗' });
    }
    res.json(rows);
  });
});

// 購買商品
app.post('/api/buy', (req, res) => {
  const { buyer, itemId } = req.body;
  if (!buyer || !itemId) return res.status(400).json({ error: '資料不完整' });

  // 查詢商品
  db.get('SELECT * FROM items WHERE id = ? AND status = "available"', [itemId], (err, item) => {
    if (err || !item) return res.status(404).json({ error: '找不到可購買的商品' });

    // 查詢買家餘額
    db.get('SELECT balance FROM users WHERE username = ?', [buyer], (err, user) => {
      if (err || !user) return res.status(404).json({ error: '找不到使用者' });
      if (user.balance < item.price) return res.status(400).json({ error: '餘額不足' });

      // 交易：更新商品狀態與扣除餘額
      const stmt1 = db.prepare('UPDATE items SET status = "sold" WHERE id = ?');
      const stmt2 = db.prepare('UPDATE users SET balance = balance - ? WHERE username = ?');
      stmt1.run(itemId);
      stmt2.run(item.price, buyer, function (err) {
        if (err) return res.status(500).json({ error: '購買失敗' });
        res.json({ success: true });
      });
    });
  });
});


// 首頁導向登入頁
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`🚀 網站已啟動：http://localhost:${port}`);
});
