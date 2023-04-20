import WebSocket from "ws";
import express, { json } from "express";
import { TransactionsService } from "./src/services/transactions.service.js";

const transaction = new TransactionsService();

const ws = new WebSocket(
  `${process.env.STREAM_URL}/${process.env.SYMBOL_BTCUSDT.toLowerCase()}@ticker`
);

let currentPrice = 0;

ws.onmessage = async (event) => {
  const obj = JSON.parse(event.data);

  currentPrice = parseFloat(obj.a);
};

const app = express();

app.use(json());

app.use("/sell", async (req, res, next) => {
  transaction.handleRequest("SELL", currentPrice, res);
});

app.use("/buy", async (req, res, next) => {
  transaction.handleRequest("BUY", currentPrice, res);
});

app.listen(process.env.PORT, () => {
  console.log("Server started at " + process.env.PORT);
});
