import sqlite from "sqlite3";

const { Database, OPEN_READWRITE } = sqlite;

export class SQLiteDatabase {
  constructor() {
    // CREATE TABLE
    // this.db.run(
    //   "CREATE TABLE transactions (qty_usd, qty_btc, price_btc, operation, time)"
    // );
    // this.db.run("CREATE TABLE logs (message, operation, time)");
  }

  insertTransactionInDatabase = (
    usdPaid,
    minimalOperation,
    currentPrice,
    operation,
    date
  ) => {
    const sql = `INSERT INTO transactions (qty_usd, qty_btc, price_btc, operation, time) VALUES(?,?,?,?,?)`;

    this.openDatabase();

    this.db.run(
      sql,
      [usdPaid, minimalOperation, currentPrice, operation, date],
      (err) => {
        if (err) return console.error(err.message);
        console.log("Data successfully inserted");
      }
    );

    this.closeDatabase();
  };

  insertLogInDatabase = (message, operation, date) => {
    const sql = `INSERT INTO logs (message, operation, time) VALUES(?,?,?)`;

    this.openDatabase();

    this.db.run(sql, [message, operation, date], (err) => {
      if (err) return console.error(err.message);
      console.log("Data successfully inserted");
    });

    this.closeDatabase();
  };

  openDatabase = () => {
    this.db = new Database("./data.db", OPEN_READWRITE, (err) => {
      if (err) return console.error(err.message);
      console.log("Database connected");
    });
  };

  closeDatabase = () => {
    this.db.close((err) => {
      if (err) return console.error(err.message);
      console.log("Database disconnected");
    });
  };
}
