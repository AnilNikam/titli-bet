
const { SORAT_JOIN_TABLE } = require("./joinTable");
const { leaveTable } = require("./leaveTable");
const { disconnectTableHandle, findDisconnectTable } = require("./disconnectHandle");
const { ClearBetSORAT,actionslot,DoubleBetSORAT,GETHISTORYSORAT } = require("./gamePlay");


module.exports = {
  sortjointable: SORAT_JOIN_TABLE,
  leaveTable: leaveTable,
  findDisconnectTable: findDisconnectTable,
  disconnectTableHandle: disconnectTableHandle,
  actionslot:actionslot,
  ClearBetSORAT:ClearBetSORAT,
  DoubleBetSORAT:DoubleBetSORAT,
  GETHISTORYSORAT:GETHISTORYSORAT
};
