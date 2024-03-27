const { Schema, model } = require("mongoose");

const ProfileSchema = new Schema({
  imageId: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  facebookUrl: {
    type: String,
  },
  instagramUrl: {
    type: String,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Account",
  }
}, {
  timestamps: true,
});
const ProfileModel = model("Profile", ProfileSchema);
module.exports = ProfileModel;
