const {
  GetID,
  SHA256DataToHex,
  ArrayToStringHex,
} = require("../utils/function");
const Vote = require("./vote");
const Users = require("./users");

class Action {
  /**
   *
   * @param {string} type
   * @param {Users|Vote} data -Class Users or Elections
   * @param {number[]} signature
   * @param {string} lock
   */
  constructor(type, data, signature, lock) {
    this.type = type;
    if (type === "users") {
      this.data = new Users(null, null, null, null);
      if (data !== null) {
        this.data.parseData(data);
      }
    } else {
      this.data = new Vote(null, null, null);
      if (data !== null) {
        this.data.parseData(data);
      }
    }

    if (signature !== null) {
      this.signature = [...signature];
    } else {
      this.signature = null;
    }

    this.lock = lock;
    this.timeStamp = Date.now();
    this.id = GetID(this.timeStamp);
  }

  getDetails() {
    const { id, type, timeStamp, data, signature, lock } = this;
    let hex = null;
    if (signature !== null) {
      hex = ArrayToStringHex(signature);
    }
    return {
      id,
      type,
      timeStamp,
      data: data.getDetails(),
      signature: hex,
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
   * @param {{id:string, type:string, timeStamp:number, data:Users|Vote, signature:number[], lock:string}} action
   */
  parseData(action) {
    this.id = action.id;
    this.type = action.type;
    this.timeStamp = action.timeStamp;

    if (this.type === "users") {
      this.data = new Users(null, null, null, null);
      this.data.parseData(action.data);
    } else {
      this.data = new Vote(null, null, null);
      this.data.parseData(action.data);
    }

    if (action.signature !== null) {
      this.signature = [...action.signature];
    } else {
      this.signature = null;
    }

    this.lock = action.lock;
  }

  SHA256ActionToHex() {
    return SHA256DataToHex(this.getDetails());
  }
}

module.exports = Action;
