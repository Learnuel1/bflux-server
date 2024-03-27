const { model, Schema } = require("mongoose");

const AccountSchema = new Schema({
  username: {
    type: String,
     required: true,
     index: true,
     unique: true,
  },
  firstName:{
    type: String,
    required: true
  },
  lastName:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  dob: {
    type: Date,
    required: true
  },
  address:{
    type: String,

  },
  password: {
    type: String,
     required: true,
     index: true,
  },
refreshToken :{
  type :[]
},
type: {
  type: String,
  required: true,
  enum:["user", "admin"],
},
state: {
  type: String,
  required: true,
  enum: ["active", "suspended", "deactivated"],
  default: "active",
},
}, {timestamps: true});

const AccountModel = model("Account", AccountSchema);
module.exports = AccountModel;
