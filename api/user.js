const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const __ = require('./appUtils');
const User = require('../schema/User');
const auth = require('../middlewares/auth');

const router = express.Router();

const signup = async (req, res) => {
    const error = __.validate(req.body, {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let user;
    user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send(__.error('Email already registered'));

    user = {
        email: req.body.email,
        password: req.body.password,
    };

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    const newUser = new User(user);
    await newUser.save();
    const token = newUser.generateAuthToken();

    res.header('x-user-auth-token', token)
       .status(200)
       .send(__.success('Signed up.'));
};

const login = async (req, res) => {
    const error = __.validate(req.body, {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }); 
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let user = await User.findOne({email: req.body.email }, 'password');
    if (!user) return res.status(400).send(__.error('This email is not registered'));

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send(__.error('Invalid password'));

    const authToken = user.generateAuthToken();
    res.header('x-user-auth-token', authToken)
       .status(200)
       .send(__.success('Loged in.'));
};  

const addTag = async (req, res) => {
    const error = __.validate(req.body, {
        name: Joi.string().required(),
        color: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id }, {
        $push: { 
            tags: {
                name: req.body.name,
                color: req.body.color
            }
        }
    });

    res.status(200).send(__.success('Tags added'));
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/addTag', auth, addTag);

module.exports = router;