const mongoose = require('mongoose');
const bcrypt = require('bcrypt') ;
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        require: true,
        lowercase: true,
        unique : true
    },
    password: {
        type: String,
        require : true 
  }
});
//a middleware that will run when .save monngose function will be called
//which encyrpt our password 
userSchema.pre('save', async function (next) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(this.password, salt);
        this.password = hashedpassword;
        next(); 
    } catch (error) {
        next(error);
    }
})

userSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password); //comapres passwords
    } catch (error) {
        throw error 
    }
}
module.exports = mongoose.model('user', userSchema);