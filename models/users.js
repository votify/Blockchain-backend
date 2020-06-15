const { ArrayToStringHex, JSONToUint8Array } = require("../utils/function");

class Users {
  /**
   *
   * @param {string} id
   * @param {Date} dob
   * @param {string} name
   * @param {Uint8Array} pubKey
   */
  constructor(id, dob, name, pubKey) {
    this.id = id;
    this.dob = new Date(dob.getTime());
    this.name = name;
    this.pubKey = Uint8Array.from(pubKey);
  }

  getDetails() {
    const { id, dob, name, pubKey } = this;
    return {
      id,
      dob,
      name,
      pubKey: Buffer.from(pubKey).toString("hex"),
    };
  }

  getData() {
    const { id, dob, name, pubKey } = this;
    return {
      id,
      dob,
      name,
      pubKey,
    };
  }

  /**
   *
   * @param {{id:string, dob:Date, name:string, pubKey:Uint8Array}} user
   */
  parseData(user) {
    this.id = user.id;
    this.dob = new Date(user.dob.getTime());
    this.name = user.name;
    this.pubKey = Uint8Array.from(user.pubKey);
  }

  getPubKeyHex() {
    return ArrayToStringHex(this.pubKey);
  }
}

module.exports = Users;
