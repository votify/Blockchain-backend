const crypto = require("crypto");
var BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const bs58 = require("base-x")(BASE58);
/**
 * @param {object} data - data to hash SHA256.
 */
module.exports.JSONToUint8Array = (data) => {
  var buffer = crypto
    .createHash("sha256")
    .update(JSON.stringify(data), "utf8")
    .digest();
  const hash = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.length / Uint8Array.BYTES_PER_ELEMENT
  );
  return hash;
};

/**
 * @param {string} datadata - String to hash SHA256.
 */
module.exports.StringToUint8Array = (data) => {
  var buffer = crypto.createHash("sha256").update(data, "utf8").digest();
  const hash = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.length / Uint8Array.BYTES_PER_ELEMENT
  );
  return hash;
};

/**
 * @param {object} data - Hash array number.
 */
module.exports.SHA256DataToHex = (data) => {
  var buffer = crypto
    .createHash("sha256")
    .update(JSON.stringify(data), "utf8")
    .digest("hex");
  return buffer;
};

/**
 * @param {number[]} array
 */
module.exports.ArrayToStringHex = (array) => {
  return Array.from(array, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
};

/**
 * @param {string} str - Hex string input.
 */
module.exports.ParseHexString = (str) => {
  var result = [];
  while (str.length >= 2) {
    result.push(parseInt(str.substring(0, 2), 16));

    str = str.substring(2, str.length);
  }

  return result;
};

/**
 *
 * @param {number} timeStamp
 */
module.exports.GetID = (timeStamp) => {
  const random = Math.random() * 100000000;
  var buffer = crypto
    .createHash("sha256")
    .update(`${timeStamp}-${random}`, "utf8")
    .digest();
  return bs58.encode(buffer);
};
