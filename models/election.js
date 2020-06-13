class Elections {
  /**
   *
   * @param {number} year
   * @param {string} name
   * @param {string[]} nominees
   */
  constructor(year, name, nominees) {
    this.year = year;
    this.name = name;
    this.nominees = [...nominees];
  }

  getDetails() {
    const { year, name, nominees } = this;
    return {
      year,
      name,
      nominees: nominees.toString(),
    };
  }

  getData() {
    const { year, name, nominees } = this;
    return {
      year,
      name,
      nominees,
    };
  }
  /**
   *
   * @param {{year:number, name:string, nominees:string[]}} election
   */
  parseData(election) {
    this.year = election.year;
    this.name = election.name;
    this.nominees = [...election.nominees];
  }
}

module.exports = Elections;
