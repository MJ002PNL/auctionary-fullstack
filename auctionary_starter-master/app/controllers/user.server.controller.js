const db = require('../../database');
const crypto = require('crypto');

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
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

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function sendBadRequest(res) {
    return res.status(400).json({ error_message: 'Bad request' });
}

const registerUser = async (req, res) => {
    console.log('[registerUser] body:', req.body);

    let { first_name, last_name, email, password } = req.body || {};

    first_name = (typeof first_name === 'string') ? first_name.trim() : '';
    last_name  = (typeof last_name  === 'string') ? last_name.trim()  : '';
    email      = (typeof email      === 'string') ? email.trim()      : '';
    password   = (typeof password   === 'string') ? password.trim()   : '';

    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'extra')) {
        console.log('[registerUser] FAIL extra field "extra" present');
        return sendBadRequest(res);
    }

    if (!first_name || !last_name || !email || !password) {
        console.log('[registerUser] FAIL missing/blank field');
        return sendBadRequest(res);
    }

    const tooShort  = password.length < 6;
    const tooLong   = password.length > 20;
    const noUpper   = !/[A-Z]/.test(password);
    const noLower   = !/[a-z]/.test(password);
    const noNumber  = !/[0-9]/.test(password);
    const noSpecial = !/[^A-Za-z0-9]/.test(password);

    if (tooShort || tooLong || noUpper || noLower || noNumber || noSpecial) {
        console.log('[registerUser] FAIL password rules');
        return sendBadRequest(res);
    }

    try {
        const existing = await getQuery(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );
        if (existing) {
            console.log('[registerUser] FAIL duplicate email');
            return sendBadRequest(res);
        }

        const result = await runQuery(
            `INSERT INTO users (first_name, last_name, email, password, salt, session_token)
             VALUES (?, ?, ?, ?, NULL, NULL)`,
            [first_name, last_name, email, password]
        );

        console.log('[registerUser] SUCCESS id:', result.lastID);
        return res.status(201).json({ user_id: result.lastID });
    } catch (err) {
        console.error('[registerUser] 500 error:', err);
        return res.sendStatus(500);
    }
};

const loginUser = async (req, res) => {
    console.log('[loginUser] body:', req.body);

    const { email, password, ...rest } = req.body || {};

    if (Object.keys(rest).length > 0) {
        console.log('[loginUser] FAIL extra fields:', Object.keys(rest));
        return sendBadRequest(res);
    }

    if (!email || !password) {
        console.log('[loginUser] FAIL missing email/password');
        return sendBadRequest(res);
    }

    try {
        const user = await getQuery(
            'SELECT user_id, password, session_token FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            console.log('[loginUser] FAIL bad email');
            return sendBadRequest(res);
        }

        if (user.password !== password) {
            console.log('[loginUser] FAIL bad password');
            return sendBadRequest(res);
        }

        let token = user.session_token;
        if (!token) {
            token = crypto.randomBytes(16).toString('hex');
            await runQuery(
                'UPDATE users SET session_token = ? WHERE user_id = ?',
                [token, user.user_id]
            );
        }

        return res.status(200).json({
            user_id: user.user_id,
            session_token: token
        });
    } catch (err) {
        console.error('[loginUser] 500 error:', err);
        return res.sendStatus(500);
    }
};

const logoutUser = async (req, res) => {
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

        await runQuery(
            'UPDATE users SET session_token = NULL WHERE user_id = ?',
            [user.user_id]
        );

        return res.sendStatus(200);
    } catch (err) {
        console.error('[logoutUser] 500 error:', err);
        return res.sendStatus(500);
    }
};

const getUserById = async (req, res) => {
    const userId = parseInt(req.params.user_id, 10);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.sendStatus(404);
    }

    try {
        const user = await getQuery(
            'SELECT user_id, first_name, last_name FROM users WHERE user_id = ?',
            [userId]
        );

        if (!user) {
            return res.sendStatus(404);
        }

        const now = Date.now();

        const selling = await allQuery(
            `SELECT i.item_id,
                    i.name,
                    i.description,
                    i.end_date,
                    i.creator_id,
                    u.first_name,
                    u.last_name
             FROM items i
             JOIN users u ON i.creator_id = u.user_id
             WHERE i.creator_id = ?
               AND i.end_date > ?
             ORDER BY i.item_id ASC`,
            [userId, now]
        );

        const bidding_on = await allQuery(
            `SELECT DISTINCT i.item_id,
                    i.name,
                    i.description,
                    i.end_date,
                    i.creator_id,
                    u.first_name,
                    u.last_name
             FROM bids b
             JOIN items i ON b.item_id = i.item_id
             JOIN users u ON i.creator_id = u.user_id
             WHERE b.user_id = ?
               AND i.end_date > ?
             ORDER BY i.item_id ASC`,
            [userId, now]
        );

        const auctions_ended = await allQuery(
            `SELECT i.item_id,
                    i.name,
                    i.description,
                    i.end_date,
                    i.creator_id,
                    u.first_name,
                    u.last_name
             FROM items i
             JOIN users u ON i.creator_id = u.user_id
             WHERE i.creator_id = ?
               AND i.end_date <= ?
             ORDER BY i.item_id ASC`,
            [userId, now]
        );

        return res.status(200).json({
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            selling,
            bidding_on,
            auctions_ended
        });
    } catch (err) {
        console.error('[getUserById] 500 error:', err);
        return res.sendStatus(500);
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserById
};
