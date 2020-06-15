class Elections {
  /**
   *
   * @param {number} year
   * @param {string} name
   * @param {string[]} nominees
   * @param {number} deadline
   */
  constructor(year, name, nominees, deadline) {
    this.year = year;
    this.name = name;
    this.nominees = [...nominees];
    this.deadline = deadline;
  }

  getDetails() {
    const { year, name, nominees, deadline } = this;
    return {
      year,
      name,
      nominees: nominees.toString(),
      deadline,
    };
  }

  getData() {
    const { year, name, nominees, deadline } = this;
    return {
      year,
      name,
      nominees,
      deadline,
    };
  }
  /**
   *
   * @param {{year:number, name:string, nominees:string[], deadline:number}} election
   */
  parseData(election) {
    this.year = election.year;
    this.name = election.name;
    this.nominees = [...election.nominees];
    this.deadline = election.deadline;
  }

  getDataHash() {
    return JSONToUint8Array({
      year: this.year,
      name: this.name,
      nominees: JSON.stringify([...this.nominees]),
      deadline: this.deadline,
    });
  }
}

module.exports = Elections;
