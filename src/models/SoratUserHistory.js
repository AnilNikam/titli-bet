const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const collectionName = 'SoratUserHistory';

const SoratUserSchema = new Schema({
    userId: { type: String },
    ballposition: { type: Number },
    beforeplaypoint:{ type: Number },
    play:{ type: Number},
    won: { type: Number },
    afterplaypoint:{ type: Number },
    uuid:{ type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    betObjectData: {}
}, { versionKey: false });

module.exports = mongoose.model(collectionName, SoratUserSchema, collectionName);