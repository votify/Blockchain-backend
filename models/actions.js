const { GetID } = require("../utils/function");
const Elections = require("./election");
const Elections = require("./election");

class Action {
  /**
   *
   * @param {string} type
   * @param {Elections|Users} data -Class Users or Elections
   * @param {Uint8Array} signature
   * @param {string} lock
   */
  constructor(type, data, signature, lock) {
    this.type = type;
    this.data = data;
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
   * @param {{id:string, type:string, timeStamp:Date, data:Elections|Users, signature:Uint8Array, lock:string}} action
   */
  parseData(action) {
    this.id = action.id;
    this.type = action.type;
    this.timeStamp = new Date(action.timeStamp.getTime());
    this.data.parseData(action.data.getData());
    this.signature = Uint8Array.from(action.signature);
    this.lock = action.lock;
  }
}

module.exports = Action;
