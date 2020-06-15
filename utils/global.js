const { fork } = require("child_process");
const path = require("path");

var isKill = true;

let filePath = path.resolve(__dirname, "./proof.js");

var forked = null;

/**
 *
 * @param {import("child_process").ChildProcess} fork
 */
const setDeathFlag = (fork) => {
  fork.on("exit", () => {
    console.log("Child process is kill");
    isKill = true;
  });
  return fork;
};

/**
 * @returns {import("child_process").ChildProcess}
 */
const Fork = () => {
  if (isKill) {
    forked = setDeathFlag(fork(filePath));
    isKill = false;
    return forked;
  } else {
    return forked;
  }
};

module.exports = Fork;
