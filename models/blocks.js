const Action = require("./actions");
const crypto = require("crypto-js");
const { constants } = require("../utils/constants");

class Block {
  /**
   *
   * @param {number} index
   * @param {string} previousBlockHash
   * @param {number} nonce -Float-
   * @param {Action[]} actions -Class Action-
   */
  constructor(index, previousBlockHash, nonce, actions) {
    this.index = index;
    this.nonce = nonce;
    this.previousBlockHash = previousBlockHash;
    this.actions = actions;

    /**
     * @type {number}
     */
    this.timestamp = Date.now();
    if (index === 0) {
      this.timestamp = constants.GENESIS_DATE;
    }
  }

  hashValue() {
    const { index, nonce, actions, timestamp, previousBlockHash } = this;
    const blockString = `${index}-${nonce}-${JSON.stringify(
      actions
    )}-${timestamp}-${previousBlockHash}`;
    const hash = crypto.SHA256(blockString);
    return hash.toString(crypto.enc.Hex);
  }

  setNonce(nonce) {
    this.nonce = nonce;
  }

  getNonce() {
    return this.nonce;
  }

  getIndex() {
    return this.index;
  }

  getPreviousBlockHash() {
    return this.previousBlockHash;
  }

  getDetails() {
    const { index, nonce, previousBlockHash, actions, timestamp } = this;
    return {
      index,
      nonce,
      timestamp,
      previousBlockHash,
      actions: actions.map((actions) => actions.getDetails()),
    };
  }

  getData() {
    const { index, nonce, previousBlockHash, actions, timestamp } = this;
    return {
      index,
      nonce,
      timestamp,
      previousBlockHash,
      actions: actions.map((action) => action.getData()),
    };
  }

  /**
   *
   * @param {{index:number, nonce:number, previousBlockHash: string, timestamp:number, actions:Action[]}} block
   */
  parseBlock(block) {
    this.index = block.index;
    this.nonce = block.nonce;
    this.previousBlockHash = block.previousBlockHash;
    this.timestamp = block.timestamp;
    this.actions = block.actions.map((action) => {
      const parsedAction = new Action(null, null, null, null);
      parsedAction.parseData(action);
      return parsedAction;
    });
  }
}

module.exports = Block;
