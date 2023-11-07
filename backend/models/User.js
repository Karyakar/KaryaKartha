const mongoose = require('mongoose');
const {Schema} = mongoose;
// Define the User schema
const userSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'user'
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: String,
  resetPasswordTokenExpires: Date,
});

const User = mongoose.model('User', userSchema);
User.createIndexes();
module.exports = User;