const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'andarBaharPlayingTables';
//const BetLists = mongoose.model('betList');

const PlayingTablesSchema = new Schema({
    gameId: { type: String, default: "" },
    entryFee: { type: Number },
    gameType: { type: String },
    maxSeat: { type: Number, default: 6 },
    activePlayer: { type: Number, default: 0 },
    //betId: { type: mongoose.Schema.Types.ObjectId, ref: BetLists },
    boot: { type: Number, default: 0 },
    chalLimit: { type: Number, default: 0 },
    potLimit: { type: Number, default: 0 },
    // anderCards: [{ type: String, default: [] }],
    // baharCards: [{ type: String, default: [] }],
    ANBCards: { ander: [], bahar: [] },
    playerInfo: [],
    gameState: { type: String, default: "" },
    turnStartTimer: { type: Date },
    dealerSeatIndex: { type: Number, default: -1 },
    turnSeatIndex: { type: Number, default: -1 },
    jobId: { type: String, default: "" },
    turnDone: { type: Boolean, default: false },
    gameTimer: {},
    gameTracks: [],
    callFinalWinner: { type: Boolean, default: false },
    isLastUserFinish: { type: Boolean, default: false },
    isFinalWinner: { type: Boolean, default: false },
}, { versionKey: false });

module.exports = mongoose.model(collectionName, PlayingTablesSchema, collectionName);
