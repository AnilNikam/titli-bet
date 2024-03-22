const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'shop';
const AgentList = mongoose.model('agent');

const ShopSchema = new Schema(
  {
    email: { type: String, required: true },
    password:{type: String},
    name: { type: String },
    mobileno: {type: String},
    createdAt: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: Date.now },
    agentId:{ type: mongoose.Schema.Types.ObjectId, ref: AgentList },
    status:{ type: String },
    location:{ type: String },
    area:{ type: String }
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, ShopSchema, collectionName);
