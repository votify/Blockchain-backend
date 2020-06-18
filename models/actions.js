const { GetID, SHA256DataToHex } = require("../utils/function");
const Vote = require("./vote");
const Users = require("./users");
const Elections = require("./election");

class Action {
  /**
   *
   * @param {string} type
   * @param {Users|Vote} data -Class Users or Elections
   * @param {Uint8Array} signature
   * @param {string} lock
   */
  constructor(type, data, signature, lock) {
    this.type = type;
    if (type === "users") {
      this.data = new Users(null, null, null, null);
      this.data.parseData(data);
    } else {
      this.data = new Vote(null, null, null);
      this.data.parseData(data);
    }
    this.signature = Uint8Array.from(signature);
    this.lock = lock;
    this.timeStamp = Date.now();
    this.id = GetID(this.timeStamp);
  }

  getDetails() {
    const { id, type, timeStamp, data, signature, lock } = this;
    return {
      id,
      type,
      timeStamp,
      data: data.getDetails(),
      signature: Buffer.from(signature).toString("hex"),
      lock,
    };
  }

  getData() {
    const { id, type, timeStamp, data, signature, lock } = this;
    return {
      id,
      type,
      timeStamp,
      data: data.getData(),
      signature,
      lock,
    };
  }

  /**
   *
   * @param {{id:string, type:string, timeStamp:number, data:Users|Vote, signature:Uint8Array, lock:string}} action
   */
  parseData(action) {
    this.id = action.id;
    this.type = action.type;
    this.timeStamp = action.timeStamp;
    this.data.parseData(action.data.getData());
    this.signature = Uint8Array.from(action.signature);
    this.lock = action.lock;
  }

  SHA256TransactionToHex() {
    return SHA256DataToHex(this.getDetails());
  }
}

module.exports = Action;
