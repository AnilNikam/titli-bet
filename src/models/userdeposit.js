const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'userdeposit';
const GameUser = require("./users");

const userDepositSchema = new Schema({
    name:{ type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    email:{ type: String, default: "" },
    mobileno: { type: String, default: "" },
    UTR: { type: String, default: "" },
    screenshort:{ type: String, default: "" },
    depositamount:{ type: Number, default: 0 },
    bankAc:{ type: String, default: "" },
    IFSCcode:{ type: String, default: "" },
    acname:{ type: String, default: "" },
    upi_id:{ type: String, default: "" },
    dateOfdeposit:{ type: Date },
    paymentmode:{ type: String, default: "" },
    status:{ type: Number, default: -1 },
    approve:{ type: Number, default: 0 },
    reject:{ type: Number, default: 0 },
}, { versionKey: false });

module.exports = mongoose.model(collectionName, userDepositSchema, collectionName);
