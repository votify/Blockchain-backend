const Block = require("./blocks");
const Action = require("./actions");
const forked = require("../utils/global");
const { constants, actions } = require("../utils/constants");
const { GetNormalize, ArrayToStringHex } = require("../utils/function");
const Users = require("./users");
const secp256k1 = require("secp256k1");

class Chain {
  /**
   *
   * @param {SocketIO.Server} io
   * @param {Block[]} blocks
   */
  constructor(io, blocks) {
    this.blocks = blocks || [new Block(0, 1, 0, [])];
    /**
     * @type {Action[]}
     */
    this.currentActions = [];
    /**
     * @type {SocketIOClient.Socket[]}
     */
    this.nodes = [];
    this.io = io;
    /**
     * @type {Action[]}
     */
    this.actionBuffer = null;
    /**
     * @type {Block}
     */
    this.blocksBuffer = null;
    this.miningStatus = false;
    this.confirm = 0;
    this.deny = 0;
    this.isConfirm = false;
    this.tableOfContent = {};
    this.elections = {};
    this.usersBuffer = {};
  }

  /**
   *
   * @param {SocketIOClient.Socket} node
   */
  addNode(node) {
    this.nodes.push(node);
  }

  /**
   *
   * @param {Action} action
   */
  verifyAction(action) {
    if (action.type === "users") {
      if (!this.getLock(ArrayToStringHex(action.data.pubKey))) {
        if (
          this.usersBuffer[ArrayToStringHex(action.data.pubKey)] === undefined
        ) {
          this.usersBuffer[ArrayToStringHex(action.data.pubKey)] = true;
          return true;
        }
        return false;
      } else {
        return false;
      }
    }

    let position = this.tableOfContent[action.lock];

    if (position === undefined) {
      return false;
    }

    let pubkey = this.blocks[position.block].actions[position.index].data
      .pubKey;

    let dataHash = action.data.getDataHash();
    if (
      !secp256k1.ecdsaVerify(
        new Uint8Array(action.signature),
        dataHash,
        new Uint8Array(pubkey)
      )
    ) {
      return false;
    }

    if (action.type === "vote") {
      let electionId = `_${action.data.year}_${GetNormalize(action.data.name)}`;
      let voterList = this.elections[electionId];
      if (voterList === undefined) {
        return false;
      } else {
        if (voterList.voters[action.lock] !== undefined) {
          return false;
        } else {
          let deadline = voterList.deadline;
          if (action.timeStamp < deadline) {
            this.elections[electionId].voters[action.lock] = action.id;
          } else {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   *
   * @param {string} electionId
   */
  countVote(electionId) {
    let result = {};
    let thisElection = this.elections[electionId];
    if (thisElection === undefined) {
      return false;
    }
    let votersList = Object.values(thisElection.voters);

    for (let index = 0; index < votersList.length; index++) {
      let votePos = this.tableOfContent[votersList[index]];
      if (votePos !== undefined) {
        let vote = this.blocks[votePos.block].actions[votePos.index];
        if (result[GetNormalize(vote.data.nominee)] === undefined) {
          result[GetNormalize(vote.data.nominee)] = {
            name: vote.data.nominee,
            count: 1,
          };
        } else {
          result[GetNormalize(vote.data.nominee)].count += 1;
        }
      } else {
        if (result.UnCount === undefined) {
          result.UnCount = { name: "Uncount vote", count: 1 };
        } else {
          result.UnCount.count += 1;
        }
      }
    }

    return Object.values(result);
  }

  /**
   *
   * @param {string} address
   */
  getStatus(address) {
    if (this.tableOfContent[address] !== undefined) {
      return true;
    } else {
      return false;
    }
  }

  getElections() {
    let elections = Object.keys(this.elections);
    let result = [];

    for (let index = 0; index < elections.length; index++) {
      let election = this.elections[elections[index]];

      result.push({
        id: elections[index],
        year: election.year,
        name: election.name,
        nominees: [...election.nominees],
        deadline: election.deadline,
      });
    }
    return result;
  }

  /**
   *
   * @param {string} electionId
   */
  getElection(electionId) {
    let election = this.elections[electionId];

    if (election === undefined) {
      return { result: null };
    }

    let result = {
      id: electionId,
      year: election.year,
      name: election.name,
      nominees: [...election.nominees],
      deadline: election.deadline,
    };
    return { result };
  }

  /**
   *
   * @param {string} actionId
   */
  getAction(actionId) {
    let action = this.tableOfContent[actionId];

    if (action === undefined) {
      return { data: null };
    }
    return { data: this.blocks[action.block].actions[action.index].data };
  }

  mineBlock(block) {
    this.blocksBuffer = block;
    this.confirm++;
    this.reset();
    console.log("Mined Successfully");
    let tempChain = this.toArrayData();
    tempChain.push(block);
    this.io.emit(actions.END_MINING, {
      blocks: tempChain,
    });
  }
  /**
   *
   * @param {Action} action
   */
  async newAction(action) {
    this.currentActions.push(action);
    await this.minning();
  }

  async minning() {
    if (this.currentActions.length > 0 && !this.miningStatus) {
      this.miningStatus = true;
      let spliceNumber =
        this.currentActions.length >= constants.NUMBER_OF_ACTION
          ? constants.NUMBER_OF_ACTION
          : this.currentActions.length;
      this.actionBuffer = this.currentActions.splice(0, spliceNumber);
      console.info("Starting mining block...");
      const previousBlock = this.lastBlock();
      const actionsInBlock = this.actionBuffer.map((value) => {
        let action = new Action(null, null, null, null);
        action.parseData(value);
        return action;
      });
      const block = new Block(
        previousBlock.getIndex() + 1,
        previousBlock.hashValue(),
        previousBlock.getNonce(),
        actionsInBlock
      );
      forked().send(block);
      forked().on("message", (proof) => {
        block.setNonce(proof);
        this.mineBlock(block);
      });
    }
  }

  /**
   *
   * @param {string} pubKey
   */
  getLock(pubKey) {
    for (let index = 0; index < this.blocks.length; index++) {
      let currentBlockActions = this.blocks[index].actions;
      for (let index1 = 0; index1 < currentBlockActions.length; index1++) {
        if (currentBlockActions[index1].type === "users") {
          let temp = new Users(null, null, null, null);
          temp.parseData(currentBlockActions[index1].data);
          if (temp.getPubKeyHex() === pubKey) {
            return currentBlockActions[index1].id;
          }
        }
      }
    }
    return false;
  }

  /**
   *
   * @param {string} lock
   */
  getHistory(lock) {
    let myActions = [];
    for (let index = 0; index < this.blocks.length; index++) {
      let currentBlockActions = this.blocks[index].actions;
      for (let index1 = 0; index1 < currentBlockActions.length; index1++) {
        if (currentBlockActions[index1].type !== "users") {
          if (currentBlockActions[index1].lock === lock) {
            let tempAction = new Action(null, null, null, null);
            tempAction.parseData(currentBlockActions[index1]);
            myActions.push({
              data: tempAction.data.getDetails(),
              time: tempAction.timeStamp,
            });
          }
        }
      }
    }
    return myActions;
  }

  async reMinning() {
    console.info("Starting mining block...");
    const previousBlock = this.lastBlock();
    process.env.BREAK = false;
    const actionsInBlock = this.actionBuffer.map((value) => {
      let action = new Action(null, null, null, null);
      action.parseData(value);
      return action;
    });
    const block = new Block(
      previousBlock.getIndex() + 1,
      previousBlock.hashValue(),
      previousBlock.getNonce(),
      actionsInBlock
    );
    forked().send(block);
    forked().on("message", (proof) => {
      block.setNonce(proof);
      this.mineBlock(block);
    });
  }

  lastBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  getLength() {
    return this.blocks.length;
  }

  checkValidity() {
    const { blocks } = this;
    let previousBlock = blocks[0];
    for (let index = 1; index < blocks.length; index++) {
      const currentBlock = blocks[index];
      if (currentBlock.getPreviousBlockHash() !== previousBlock.hashValue()) {
        return false;
      }
      if (
        currentBlock.hashValue().substring(0, constants.DIFFICULTY.length) !==
        constants.DIFFICULTY
      ) {
        return false;
      }
      if (currentBlock.index !== index) {
        return false;
      }
      previousBlock = currentBlock;
    }
    return true;
  }

  /**
   *
   * @param {Block[]} otherBlocks
   */
  compareCurrentBlock(otherBlocks) {
    const { blocks } = this;
    if (otherBlocks.length !== blocks.length + 1) {
      console.log("Wrong block length");
      return false;
    }

    for (let index = 0; index < blocks.length; index++) {
      if (blocks[index].hashValue() !== otherBlocks[index].hashValue()) {
        console.log("Wrong log hash");
        console.log(blocks[index]);
        console.log(otherBlocks[index]);
        return false;
      }
    }

    let newBlockAction = otherBlocks[otherBlocks.length - 1].actions;

    for (let index1 = 0; index1 < this.actionBuffer.length; index1++) {
      if (
        newBlockAction[index1].SHA256ActionToHex() !==
        this.actionBuffer[index1].SHA256ActionToHex()
      ) {
        console.log("Wrong action");
        console.log(newBlockAction[index1]);
        console.log(this.actionBuffer[index1]);
        return false;
      }
    }

    let newBlock = otherBlocks.splice(otherBlocks.length - 1, 1);
    this.blocksBuffer = newBlock[0];
    return true;
  }
  /**
   *
   * @param {Block[]} blocks
   */
  parseChain(blocks) {
    this.blocks = blocks.map((block) => {
      const parsedBlock = new Block(null, null, null, null);
      parsedBlock.parseBlock(block);
      return parsedBlock;
    });
  }

  toArray() {
    return this.blocks.map((block) => block.getDetails());
  }

  toArrayData() {
    return this.blocks.map((block) => block.getData());
  }

  printBlocks() {
    this.blocks.forEach((block) => console.log(block));
  }

  confirmBlock() {
    console.log("Someone confirm");
    if (!this.isConfirm) {
      this.confirm++;
      let totalNodes = this.nodes.length + 1;
      if (this.confirm >= totalNodes / 2) {
        console.log("Enough confirm");
        this.miningStatus = false;
        this.confirm = 0;
        this.addToToC();
        const tempBlock = new Block(null, null, null, null);
        tempBlock.parseBlock(this.blocksBuffer);
        this.blocks.push(tempBlock);
        this.blocksBuffer = null;
        this.actionBuffer = null;
        this.isConfirm = true;
        this.minning();
      }
    }
  }

  denyBlock() {
    console.log("Someone deny");
    if (!this.isConfirm) {
      this.deny++;
      let totalNodes = this.nodes.length + 1;
      if (this.deny >= totalNodes / 2) {
        console.log("Enough deny");
        this.miningStatus = false;
        this.deny = 0;
        this.blocksBuffer = null;
        this.isConfirm = true;
        this.reMinning();
      }
    }
  }

  getStatus() {
    return this.miningStatus;
  }

  reset() {
    this.deny = 0;
    this.confirm = 0;
    this.isConfirm = false;
  }

  /**
   *
   * @param {number} year
   * @param {string} name
   * @param {string[]} nominees
   * @param {number} deadline
   */
  setElection(year, name, nominees, deadline) {
    let electionId = `_${year}_${GetNormalize(name)}`;
    if (this.elections[electionId] !== undefined) {
      return false;
    }
    this.elections[electionId] = {
      year,
      name,
      deadline,
      nominees,
      voters: {},
    };

    return true;
  }

  /**
   *
   * @param {number} year
   * @param {string} name
   * @param {number} newDeadline
   */
  extentElection(year, name, newDeadline) {
    let electionId = `_${year}_${GetNormalize(name)}`;
    if (this.elections[electionId] !== undefined) {
      this.elections[electionId].deadline = newDeadline;
      return true;
    } else {
      return false;
    }
  }

  addToToC() {
    for (let index = 0; index < this.actionBuffer.length; index++) {
      let action = this.actionBuffer[index];
      this.tableOfContent[action.id] = { block: this.blocks.length, index };

      if (action.type === "users") {
        delete this.usersBuffer[ArrayToStringHex(action.data.pubKey)];
      }
    }
  }
}

module.exports = Chain;
