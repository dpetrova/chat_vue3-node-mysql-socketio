const mysql = require("mysql2");
let db = null;

class DB {
  // !!!! Create DB in mySQL Workbench first !!!!
  constructor() {
    // create the connection to database
    db = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root",
      database: "vue3-node-socketio-chat-app",
    });
    db.connect((err) => {
      if (err) console.log(err);
      else {
        console.log("Database connected successfuly!");

        //create tables "users" if does not exist
        db.query(
          `
            CREATE TABLE IF NOT EXISTS users(
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,                
            user_id VARCHAR(255) NOT NULL
        )`,
          (err, results, fields) => {
            console.log(err);
            console.log(results); // results contains rows returned by server
            console.log(fields); // fields contains extra meta data about results, if available
          }
        );

        //create tables "messages" if does not exist
        db.query(
          `
              CREATE TABLE IF NOT EXISTS messages(
              id INT PRIMARY KEY AUTO_INCREMENT,
              message VARCHAR(255) NOT NULL,
              user_id VARCHAR(255) NOT NULL,
              name VARCHAR(255) 
          )`,
          (err, results, fields) => {
            console.log(err);
            console.log(results); // results contains rows returned by server
            console.log(fields); // fields contains extra meta data about results, if available
          }
        );
      }
    });
  }

  addUser(data) {
    return new Promise(async (resolve, reject) => {
      if (await this.isUserExist(data)) {
        resolve(true);
      } else
        db.execute(
          "INSERT INTO users (name, user_id) VALUES (?,?)",
          [data.name, data.user_id],
          (err, rows) => {
            if (err) reject(new Error(err));
            else resolve(rows);
          }
        );
    });
  }

  isUserExist(data) {
    return new Promise((resolve, reject) => {
      db.execute(
        "SELECT * FROM users WHERE name = ?",
        [data.name],
        (err, rows) => {
          if (err) reject(new Error(err));
          else resolve(rows[0]);
        }
      );
    });
  }

  fetchUserMessages(data) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * from messages where name =?",
        [data.name],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  storeUserMessage(data) {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO messages (message, user_id, name) VALUES (?,?,?)",
        [data.message, data.user_id, data.name],
        (err, rows) => {
          if (err) reject(new Error(err));
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = DB;
