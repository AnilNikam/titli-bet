const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'agent';

const AgentSchema = new Schema(
  {
    email: { type: String, required: true },
    password:{type: String},
    name: { type: String },
    mobileno: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: Date.now },
    status:{ type: String },
    location:{ type: String },
    area:{ type: String }
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, AgentSchema, collectionName);
