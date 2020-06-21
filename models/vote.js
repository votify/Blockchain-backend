const { JSONToUint8Array } = require("../utils/function");

class Vote {
  /**
   *
   * @param {number} year
   * @param {string} name
   * @param {string} nominee
   */
  constructor(year, name, nominee) {
    this.year = year;
    this.name = name;
    this.nominee = nominee;
  }

  getDetails() {
    const { year, name, nominee } = this;
    return {
      year,
      name,
      nominee,
    };
  }

  getData() {
    const { year, name, nominee } = this;
    return {
      year,
      name,
      nominee,
    };
  }
  /**
   *
   * @param {{year:number, name:string, nominee:string, timeStamp:number}} election
   */
  parseData(election) {
    this.year = election.year;
    this.name = election.name;
    this.nominee = election.nominee;
  }

  getDataHash() {
    return JSONToUint8Array({
      year: this.year,
      name: this.name,
      nominee: this.nominee,
    });
  }
}

module.exports = Vote;
