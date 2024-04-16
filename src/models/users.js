const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'users';

const Shop = require("./shop");


const GameUserSchema = new Schema(
  {
    id: { type: Number },
    name: { type: String },
    username: { type: String },
    deviceId: { type: String,  },
    mobileNumber: { type: String, default: ''  },
    uniqueId: { type: String },
    email: { type: String, default: '' },
    password: { type: String, default: '' },
    facebookid:{ type: String, default: '' },
    googleid:{ type: String, default: '' },
    loginType: { type: String, enum: ['Mobile', 'Guest', 'Facebook', 'Google'], require: true, default: 'Guest' },
    chips: { type: Number },
    winningChips: { type: Number },
    bonus:{ type: Number },
    referralCode: { type: String },
    referredBy: { type: String },
    profileUrl: { type: String },
    deviceType: { type: String, default: 'Android' },
    
    flags: {
      isOnline: { type: Number, default: 0 }
    },
    counters: {
      gameWin: { type: Number, default: 0 },
      gameLoss: { type: Number, default: 0 },
      totalMatch: { type: Number, default: 0 },
    },
    tableId: { type: String, default: '' },
    sckId: { type: String },
    status: { type: String, default: '' },
    lastLoginDate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
    isVIP: { type: Number, default: 0 },
    Iscom: { type: Number, default: 0 },
    fcmToken: { type: String, default: '' },
    shopId:{ type: mongoose.Schema.Types.ObjectId, ref: Shop },
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, GameUserSchema, collectionName);
