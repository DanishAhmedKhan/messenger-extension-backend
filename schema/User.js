const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
    email: {
        type: String, 
    },
    password: {
        type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    name: {
        type: String,
    },
    tags: [{
        name: {
            type: String,
            minlength: 1,
            maxlength: 255,
        },
        color: String,
        _id: false,
    }],
    friends: [{
        id: String,
        name: String,
        tag: String,
        imageUrl: String,
        notes: [ String ],
        _id: false,
    }],
    templates: [{
        name: String,
        messages: [ String ],
        _id: false,
    }],
});

userSchema.methods.generateAuthToken = function() {
    return jwt.sign({ _id: this._id }, config.get('userAuthToken'));
};

const User = mongoose.model('User', userSchema);
module.exports = User;