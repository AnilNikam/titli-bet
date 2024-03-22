const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'oneToTwelvePlayingTables';

const PlayingTablesSchema = new Schema({
    gameId: { type: String, default: "" },
    entryFee: { type: Number },
    gameType: { type: String },
    maxSeat: { type: Number },
    activePlayer: { type: Number, default: 0 },
    boot: { type: Number, default: 0 },
    playerInfo: [],
    gameState: { type: String, default: "" },
    turnStartTimer: { type: Date },
    dealerSeatIndex: { type: Number, default: -1 },
    turnSeatIndex: { type: Number, default: -1 },
    jobId: { type: String, default: "" },
    turnDone: { type: Boolean, default: false },
    gameTimer: {},
    gameTracks: [],
    history: [],
    betamount: [],
    tableObjects: { type: Number, data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    callFinalWinner: { type: Boolean, default: false },
    isLastUserFinish: { type: Boolean, default: false },
    isFinalWinner: { type: Boolean, default: false },
}, { versionKey: false });

module.exports = mongoose.model(collectionName, PlayingTablesSchema, collectionName);
