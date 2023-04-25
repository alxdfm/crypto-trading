import axios from "axios";
import crypto from "crypto";
import { SQLiteDatabase } from "../database/databaseSQLite.js";
import { minimalOperation } from "../helpers/utils.js";

export class TransactionsService {
  constructor() {
    this.db = new SQLiteDatabase();
  }

  buildQs = (data) => {
    const timestamp = Date.now();
    const recvWindow = 10000;

    const signature = crypto
      .createHmac("sha256", process.env.SECRET_KEY)
      .update(`${new URLSearchParams({ ...data, timestamp, recvWindow })}`)
      .digest("hex");

    const newData = { ...data, timestamp, recvWindow, signature };
    return `?${new URLSearchParams(newData)}`;
  };

  newOrder = async (quantity, side) => {
    const data = {
      symbol: process.env.SYMBOL,
      type: "MARKET",
      side,
      quantity,
    };
    const timestamp = Date.now();

    const qs = this.buildQs(data);

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
  };

  //testar em produção
  balance = async () => {
    const qs = this.buildQs({});

    try {
      const result = await axios({
        method: "GET",
        url: `${process.env.API_URL}/sapi/v1/accountSnapshot${qs}`,
        headers: { "X-MBX-APIKEY": process.env.API_KEY },
      });
      console.log(result.data);
    } catch (e) {
      const errorMessage = `Error: ${e.message}, ${e.response.data.msg}`;
      console.error(errorMessage);
    }
  };

  handleRequestOrder = async (operation, currentPrice, res) => {
    console.log("-------------------------------------------------");
    const oper = operation;
    const date = new Date(Date.now()).toLocaleString("pt-br");
    console.log(date);
    const minOperation = minimalOperation(currentPrice);
    console.log(minOperation);
    const response = await this.newOrder(minOperation, operation);
    if (!response) {
      res.send({ error: "An error has occurred." });
      return;
    }
    const usdPaid = response.usdPaid;
    const origQty = response.origQty;
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

  handleRequestBalance = async (res) => {
    const response = await this.balance();
    response ? res.send({ success: true }) : res.send({ success: false });
  };
}
