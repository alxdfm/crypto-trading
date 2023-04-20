require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const WebSocket = require("ws");
const express = require("express");

const ws = new WebSocket(
  `${process.env.STREAM_URL}/${process.env.SYMBOL_BTCUSDT.toLowerCase()}@ticker`
);

let currentPrice = 0;

ws.onmessage = async (event) => {
  const obj = JSON.parse(event.data);

  currentPrice = parseFloat(obj.a);
};

function minimalOperation(price) {
  const min = 11 / price;
  return String(min.toFixed(6));
}

async function newOrder(quantity, side) {
  const data = {
    symbol: process.env.SYMBOL_BTCUSDT,
    type: "MARKET",
    side,
    quantity,
  };

  const timestamp = Date.now();
  const recvWindow = 10000;

  const signature = crypto
    .createHmac("sha256", process.env.SECRET_KEY)
    .update(`${new URLSearchParams({ ...data, timestamp, recvWindow })}`)
    .digest("hex");

  const newData = { ...data, timestamp, recvWindow, signature };
  const qs = `?${new URLSearchParams(newData)}`;

  try {
    const result = await axios({
      method: "POST",
      url: `${process.env.API_URL}/v3/order${qs}`,
      headers: { "X-MBX-APIKEY": process.env.API_KEY },
    });
    console.log(result.data.side);
    console.log("$" + result.data.cummulativeQuoteQty);
    return {
      usdPaid: result.data.cummulativeQuoteQty,
      origQty: result.data.origQty,
    };
  } catch (e) {
    const errorMessage = `Error: ${e.message}, ${e.response.data.msg}`;
    insertLogInDatabase(
      errorMessage,
      side,
      new Date(timestamp).toLocaleString("pt-br")
    );
    console.error(errorMessage);
  }
}

////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER////////SERVER

const app = express();

app.use(express.json());

const handleRequest = async (operation, res) => {
  console.log("-------------------------------------------------");
  const oper = operation;
  const date = new Date(Date.now()).toLocaleString("pt-br");
  console.log(date);
  const minOperation = minimalOperation(currentPrice);
  const response = await newOrder(minOperation, operation);
  const usdPaid = response.usdPaid;
  const origQty = response.origQty;
  if (!usdPaid) {
    res.send({ error: "An error has occurred." });
    return;
  }
  const handleResponse = operation === "SELL" ? "VENDIDO" : "COMPRADO";
  console.log(handleResponse, origQty + " BTC À $" + currentPrice);
  res.send({ operation, currentPrice });
  insertTransactionInDatabase(usdPaid, origQty, currentPrice, oper, date);
};

app.use("/sell", async (req, res, next) => {
  await handleRequest("SELL", res);
});

app.use("/buy", async (req, res, next) => {
  await handleRequest("BUY", res);
});

app.listen(process.env.PORT, () => {
  console.log("Server started at " + process.env.PORT);
});

////////DATABASE////////DATABASE////////DATABASE////////DATABASE////////DATABASE////////DATABASE////////DATABASE////////DATABASE////////DATABASE////////DATABASE////////DATABASE///////

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./data.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message);
  console.log("Database connected");
});

// CREATE TABLE
// db.run(
//   "CREATE TABLE transactions (qty_usd, qty_btc, price_btc, operation, time)"
// );

// CREATE TABLE
// db.run("CREATE TABLE logs (message, operation, time)");

const insertTransactionInDatabase = (
  usdPaid,
  minimalOperation,
  currentPrice,
  operation,
  date
) => {
  const sql = `INSERT INTO transactions (qty_usd, qty_btc, price_btc, operation, time) VALUES(?,?,?,?,?)`;

  db.run(
    sql,
    [usdPaid, minimalOperation, currentPrice, operation, date],
    (err) => {
      if (err) return console.error(err.message);
      console.log("Data successfully inserted");
    }
  );
};

const insertLogInDatabase = (message, operation, date) => {
  const sql = `INSERT INTO logs (message, operation, time) VALUES(?,?,?)`;

  db.run(sql, [message, operation, date], (err) => {
    if (err) return console.error(err.message);
    console.log("Data successfully inserted");
  });
};
