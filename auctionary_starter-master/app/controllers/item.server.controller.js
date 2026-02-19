const db = require('../../database');

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function sendBadRequest(res) {
    return res.status(400).json({ error_message: 'Bad request' });
}

let questionsTableInitialised = false;
async function ensureQuestionsTable() {
  if (questionsTableInitialised) return;

  await runQuery(
    `CREATE TABLE IF NOT EXISTS questions (
      question_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      answer_text TEXT
    )`,
    []
  );

  questionsTableInitialised = true;
}

const createItem = async (req, res) => {
    console.log('createItem controller called');

    const token = req.header('X-Authorization');
    if (!token) {
        return res.sendStatus(401);
    }

    try {
        const user = await getQuery(
            'SELECT user_id FROM users WHERE session_token = ?',
            [token]
        );

        if (!user) {
            return res.sendStatus(401);
        }

        const { name, description, starting_bid, end_date, ...rest } = req.body || {};
        console.log('[createItem] body:', req.body);

        if (Object.keys(rest).length > 0) {
            return sendBadRequest(res);
        }

        if (
            name === undefined ||
            description === undefined ||
            starting_bid === undefined ||
            end_date === undefined
        ) {
            return sendBadRequest(res);
        }

        if (typeof name !== 'string' || name.trim() === '') {
            return sendBadRequest(res);
        }

        if (typeof description !== 'string' || description.trim() === '') {
            return sendBadRequest(res);
        }

        if (starting_bid === null || starting_bid === '') {
            console.log('[createItem] FAIL starting_bid blank:', starting_bid);
            return sendBadRequest(res);
        }

        const bid = Number(starting_bid);
        if (!Number.isFinite(bid) || bid < 0) {
            console.log('[createItem] FAIL starting_bid invalid:', starting_bid);
            return sendBadRequest(res);
        }

        const endMs = Number(end_date);
        if (!Number.isFinite(endMs)) {
            console.log('[createItem] FAIL end_date not numeric:', end_date);
            return sendBadRequest(res);
        }

        const end = new Date(endMs);
        if (isNaN(end.getTime()) || end <= new Date()) {
            console.log('[createItem] FAIL end_date invalid:', end_date);
            return sendBadRequest(res);
        }

        const now = Date.now();

        const result = await runQuery(
            `INSERT INTO items (name, description, starting_bid, start_date, end_date, creator_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name.trim(), description.trim(), bid, now, endMs, user.user_id]
        );

        return res.status(201).json({ item_id: result.lastID });

    } catch (err) {
        console.error('[createItem] error', err);
        return res.sendStatus(500);
    }
};

const addBid = async (req, res) => {
  try {
    const token = req.header('X-Authorization');
    if (!token) {
      console.log('[addBid] FAIL: missing token');
      return res.sendStatus(401);
    }

    const user = await getQuery(
      'SELECT user_id FROM users WHERE session_token = ?',
      [token]
    );
    if (!user) {
      console.log('[addBid] FAIL: invalid token');
      return res.sendStatus(401);
    }

    const itemId = Number(req.params.item_id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      console.log('[addBid] FAIL: bad item_id param', req.params.item_id);
      return res.sendStatus(404);
    }

    const item = await getQuery('SELECT * FROM items WHERE item_id = ?', [itemId]);
    if (!item) {
      console.log('[addBid] FAIL: item not found', itemId);
      return res.sendStatus(404);
    }

    if (item.creator_id === user.user_id) {
      console.log('[addBid] FAIL: creator cannot bid', { itemCreator: item.creator_id, user: user.user_id });
      return res.sendStatus(403);
    }

    const { amount, ...rest } = req.body || {};
    console.log('[addBid] body:', req.body);

    if (Object.keys(rest).length > 0) {
      console.log('[addBid] FAIL: extra fields', rest);
      return sendBadRequest(res);
    }

    if (amount === undefined || amount === null || amount === '') {
      console.log('[addBid] FAIL: missing amount', amount);
      return sendBadRequest(res);
    }

    const bidAmount = Number(amount);
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      console.log('[addBid] FAIL: invalid bid amount', amount);
      return sendBadRequest(res);
    }

    const current = await getQuery(
      'SELECT MAX(amount) AS max_amount FROM bids WHERE item_id = ?',
      [itemId]
    );

    let minAllowed = Number(item.starting_bid);
    if (current && current.max_amount !== null && current.max_amount !== undefined) {
      minAllowed = Number(current.max_amount);
    }

    console.log('[addBid] compare:', { bidAmount, minAllowed, starting_bid: item.starting_bid, max_amount: current?.max_amount });

    if (bidAmount <= minAllowed) {
      console.log('[addBid] FAIL: bid not high enough', { bidAmount, minAllowed });
      return sendBadRequest(res);
    }

    const now = Date.now();
    await runQuery(
      'INSERT INTO bids (item_id, user_id, amount, timestamp) VALUES (?, ?, ?, ?)',
      [itemId, user.user_id, bidAmount, now]
    );

    console.log('[addBid] SUCCESS', { itemId, userId: user.user_id, bidAmount });
    return res.sendStatus(201);

  } catch (err) {
    console.error('[addBid] error', err);
    return res.sendStatus(500);
  }
};


const getBids = async (req, res) => {
    try {
        const itemId = Number(req.params.item_id);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.sendStatus(404);
        }

        const item = await getQuery(
  `SELECT i.item_id,
          i.name,
          i.description,
          i.starting_bid,
          i.start_date,
          i.end_date,
          i.creator_id,
          u.first_name,
          u.last_name
   FROM items i
   LEFT JOIN users u ON i.creator_id = u.user_id
   WHERE i.item_id = ?`,
  [itemId]
);

        if (!item) {
            return res.sendStatus(404);
        }

        const bids = await allQuery(
            `SELECT b.item_id,
                    b.amount,
                    b.timestamp,
                    u.user_id,
                    u.first_name,
                    u.last_name
             FROM bids b
             JOIN users u ON b.user_id = u.user_id
             WHERE b.item_id = ?
             ORDER BY b.timestamp DESC`,
            [itemId]
        );

        return res.status(200).json(bids);
    } catch (err) {
        console.error('[getBids] error', err);
        return res.sendStatus(500);
    }
};

const getItem = async (req, res) => {
    try {
        const itemId = Number(req.params.item_id);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.sendStatus(404);
        }

        const item = await getQuery(
            `SELECT i.item_id,
                    i.name,
                    i.description,
                    i.starting_bid,
                    i.start_date,
                    i.end_date,
                    i.creator_id,
                    u.first_name,
                    u.last_name
             FROM items i
             JOIN users u ON i.creator_id = u.user_id
             WHERE i.item_id = ?`,
            [itemId]
        );

        if (!item) {
            return res.sendStatus(404);
        }

        const topBid = await getQuery(
            `SELECT b.amount,
                    u.user_id,
                    u.first_name,
                    u.last_name
             FROM bids b
             JOIN users u ON b.user_id = u.user_id
             WHERE b.item_id = ?
             ORDER BY b.amount DESC, b.timestamp DESC
             LIMIT 1`,
            [itemId]
        );

        let current_bid = item.starting_bid;
        let current_bid_holder = null;

        if (topBid) {
            current_bid = topBid.amount;
            current_bid_holder = {
                user_id: topBid.user_id,
                first_name: topBid.first_name,
                last_name: topBid.last_name
            };
        }

        return res.status(200).json({
            item_id: item.item_id,
            creator_id: item.creator_id,
            name: item.name,
            description: item.description,
            starting_bid: item.starting_bid,
            start_date: item.start_date,
            end_date: item.end_date,
            first_name: item.first_name,
            last_name: item.last_name,
            current_bid,
            current_bid_holder
        });
    } catch (err) {
        console.error('[getItem] error', err);
        return res.sendStatus(500);
    }
};

const askQuestion = async (req, res) => {
    try {
        await ensureQuestionsTable();

        const token = req.header('X-Authorization');
        if (!token) {
            return res.sendStatus(401);
        }

        const user = await getQuery(
            'SELECT user_id FROM users WHERE session_token = ?',
            [token]
        );
        if (!user) {
            return res.sendStatus(401);
        }

        const itemId = Number(req.params.item_id);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.sendStatus(404);
        }

        const item = await getQuery(
            'SELECT * FROM items WHERE item_id = ?',
            [itemId]
        );
        if (!item) {
            return res.sendStatus(404);
        }

        if (item.creator_id === user.user_id) {
            return res.sendStatus(403);
        }

        const allowed = ['question_text'];
        const extra = Object.keys(req.body).filter(k => !allowed.includes(k));
        if (extra.length > 0) {
            return res.status(400).json({ error_message: 'Bad request' });
        }

        const { question_text } = req.body;

        if (
            typeof question_text !== 'string' ||
            question_text.trim() === ''
        ) {
            return res.status(400).json({ error_message: 'Bad request' });
        }

        await runQuery(
            `INSERT INTO questions (question_text, answer_text, user_id, item_id)
             VALUES (?, NULL, ?, ?)`,
            [question_text.trim(), user.user_id, itemId]
        );

        return res.sendStatus(200);

    } catch (err) {
        console.error('[askQuestion] error', err);
        return res.sendStatus(500);
    }
};

const answerQuestion = async (req, res) => {
    try {

        await ensureQuestionsTable();

        const token = req.header('X-Authorization');
        if (!token) {
            return res.sendStatus(401);
        }

        const user = await getQuery(
            'SELECT user_id FROM users WHERE session_token = ?',
            [token]
        );
        if (!user) {
            return res.sendStatus(401);
        }
        const allowed = ['answer_text'];
        const extra = Object.keys(req.body).filter(k => !allowed.includes(k));
        if (extra.length > 0) {
            return res.status(400).json({ error_message: 'Bad request' });
        }

        const { answer_text } = req.body;

        if (
            typeof answer_text !== 'string' ||
            answer_text.trim() === ''
        ) {
            return res.status(400).json({ error_message: 'Bad request' });
        }
        const questionId = Number(req.params.question_id);
        if (!Number.isInteger(questionId) || questionId <= 0) {
            return res.sendStatus(404);
        }
        const row = await getQuery(
            `SELECT q.question_id,
                    q.item_id,
                    i.creator_id
             FROM questions q
             JOIN items i ON q.item_id = i.item_id
             WHERE q.question_id = ?`,
            [questionId]
        );

        if (!row) {
            return res.sendStatus(404);
        }

        if (row.creator_id !== user.user_id) {
            return res.sendStatus(403);
        }

        await runQuery(
            `UPDATE questions
             SET answer_text = ?
             WHERE question_id = ?`,
            [answer_text.trim(), questionId]
        );

        return res.sendStatus(200);

    } catch (err) {
        console.error('[answerQuestion] error', err);
        return res.sendStatus(500);
    }
};

const getQuestions = async (req, res) => {
    try {

        await ensureQuestionsTable();
        const itemId = Number(req.params.item_id);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.sendStatus(404);
        }
        const item = await getQuery(
            'SELECT item_id FROM items WHERE item_id = ?',
            [itemId]
        );
        if (!item) {
            return res.sendStatus(404);
        }

        const questions = await allQuery(
            `SELECT
                question_id,
                question_text,
                answer_text
             FROM questions
             WHERE item_id = ?
             ORDER BY question_id DESC`,
            [itemId]
        ); 

        return res.status(200).json(questions);

    } catch (err) {
        console.error('[getQuestions] error', err);
        return res.sendStatus(500);
    }
};

const searchItems = async (req, res) => {
    try {
        const { status, q } = req.query;

        let limit = parseInt(req.query.limit, 10);
        let offset = parseInt(req.query.offset, 10);

        if (!Number.isInteger(limit) || limit < 0) limit = 10;
        if (!Number.isInteger(offset) || offset < 0) offset = 0;

        const recognisedStatuses = ['OPEN', 'BID', 'ARCHIVE'];

        let user = null;
        const now = Date.now();

        if (status !== undefined) {
            if (!recognisedStatuses.includes(status)) {
                return res.sendStatus(400);
            }

            const token = req.header('X-Authorization');
            if (!token) {
                return res.sendStatus(400);
            }

            user = await getQuery(
                'SELECT user_id FROM users WHERE session_token = ?',
                [token]
            );
            if (!user) {
                return res.sendStatus(401);
            }
        }

        let sql = `
            SELECT i.item_id,
                   i.name,
                   i.description,
                   i.end_date,
                   i.creator_id,
                   u.first_name,
                   u.last_name
            FROM items i
            JOIN users u ON i.creator_id = u.user_id
        `;

        const where = [];
        const params = [];

        if (status === 'OPEN') {
            where.push('i.creator_id = ?');
            params.push(user.user_id);
            where.push('i.end_date > ?');
            params.push(now);
        } else if (status === 'BID') {
            where.push(`
                i.item_id IN (
                    SELECT DISTINCT item_id
                    FROM bids
                    WHERE user_id = ?
                )
            `);
            params.push(user.user_id);
        } else if (status === 'ARCHIVE') {
            where.push('i.creator_id = ?');
            params.push(user.user_id);
            where.push('i.end_date <= ?');
            params.push(now);
        }

        if (q && q !== '') {
            where.push('(i.name LIKE ? OR i.description LIKE ?)');
            const like = `%${q}%`;
            params.push(like, like);
        }

        if (where.length > 0) {
            sql += ' WHERE ' + where.join(' AND ');
        }

        sql += ' ORDER BY i.item_id ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const rows = await allQuery(sql, params);

        return res.status(200).json(rows);
    } catch (err) {
        console.error('[searchItems] error', err);
        return res.sendStatus(500);
    }
};

const getAllItems = async (req, res) => {
  try {
    const rows = await allQuery(
      `SELECT item_id, name, description, starting_bid, start_date, end_date, creator_id
       FROM items
       ORDER BY item_id DESC`,
      []
    );

    return res.status(200).json(rows);
  } catch (err) {
    console.error("[getAllItems] error", err);
    return res.sendStatus(500);
  }
};

module.exports = {
    createItem,
    addBid,
    getBids,
    getItem,
    askQuestion,
    answerQuestion,
    getQuestions,
    searchItems,
    getAllItems,
    
};
