const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = 'db.sqlite';

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.log(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        db.run(`CREATE TABLE users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT,
                last_name TEXT,
                email TEXT UNIQUE,
                password TEXT,
                salt TEXT,
                session_token TEXT,
                CONSTRAINT email_unique UNIQUE (email)
            )`, (err) => {
                if (err) {
                    console.log('Users table already created');
                } else {
                    console.log('Users table created');
                }
            }
        );

        db.run(`CREATE TABLE items (
                item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                description TEXT,
                starting_bid INTEGER,
                start_date INTEGER,
                end_date INTEGER,
                creator_id INTEGER,
                FOREIGN KEY (creator_id) REFERENCES users(user_id)
            )`, (err) => {
                if (err) {
                    console.log('Items table already created');
                } else {
                    console.log('Items table created');
                }
            }
        );

        db.run(`CREATE TABLE bids (
                item_id INTEGER,
                user_id INTEGER,
                amount INTEGER,
                timestamp INTEGER,
                PRIMARY KEY (item_id, user_id, amount),
                FOREIGN KEY (item_id) REFERENCES items(item_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )`, (err) => {
                if (err) {
                    console.log('Bid table already created');
                } else {
                    console.log('Bid table created');
                }
            }
        );

           db.run(`CREATE TABLE questions (
                question_id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT,
                answer_text TEXT,
                user_id INTEGER,
                item_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                FOREIGN KEY (item_id) REFERENCES items(item_id)
            )`, (err) => {
                if(err){
                    console.log('Questions table already created');
                }else{
                    console.log('Questions table created');
                }
            }
        );

    }
});

module.exports = db;
