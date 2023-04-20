import axios from "axios";
import crypto from "crypto";
import { SQLiteDatabase } from "../database/DatabaseSQLite.js";
import { minimalOperation } from "../helpers/utils.js";

export class TransactionsService {
  constructor() {
    this.db = new SQLiteDatabase();
  }

  async newOrder(quantity, side) {
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
      this.db.insertLogInDatabase(
        errorMessage,
        side,
        new Date(timestamp).toLocaleString("pt-br")
      );
      console.error(errorMessage);
    }
  }

  handleRequest = async (operation, currentPrice, res) => {
    console.log("-------------------------------------------------");
    const oper = operation;
    const date = new Date(Date.now()).toLocaleString("pt-br");
    console.log(date);
    const minOperation = minimalOperation(currentPrice);
    const response = await this.newOrder(minOperation, operation);
    const usdPaid = response.usdPaid;
    const origQty = response.origQty;
    if (!usdPaid) {
      res.send({ error: "An error has occurred." });
      return;
    }
    const handleResponse = operation === "SELL" ? "VENDIDO" : "COMPRADO";
    console.log(handleResponse, origQty + " BTC À $" + currentPrice);
    res.send({ operation, currentPrice });
    this.db.insertTransactionInDatabase(
      usdPaid,
      origQty,
      currentPrice,
      oper,
      date
    );
  };
}
