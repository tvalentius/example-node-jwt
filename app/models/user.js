const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const userSchema = new Schema({
  name: String,
  password: String,
  email:String,
  admin: Boolean,
});

// Don't use ES6 Arrow functions because it prevent binding of 'this'
// ref :
// http://mongoosejs.com/docs/guide.html
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions#No_binding_of_this
userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

userSchema.methods.validPassword = function (password) {
  console.log(password,this);
  return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('User', userSchema);
