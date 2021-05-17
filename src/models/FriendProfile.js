const mongoose = require('mongoose');

const { Schema } = mongoose;
// const { ObjectId } = Schema;

const friendProfileSchema = new Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User' },
  //   name: { type: String, default: '' },
  facebookId: { type: String },
  description: { type: String, default: '' },
  company: { type: String, default: '' },
  dealValue: { type: String, default: '' },
  profileData: { type: Object },
});

const FriendProfile = mongoose.model('FriendProfile', friendProfileSchema);
module.exports = FriendProfile;
