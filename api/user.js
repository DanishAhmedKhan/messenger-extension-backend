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

const removeTag = async (req, res) => {
    const error = __.validate(req.body, {
        name: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id }, {
        $pull: { 'tags': { name: req.body.name } }
    });

    res.status(200).send(__.success('Tag removed'));
};

const getAllTags = async (req, res) => {
    const { tags } = await User.findOne({ _id: req.user._id }, 'tags');
    return res.status(200).send(__.success(tags));
};

const addTagToFriend = async (req, res) => {
    const error = __.validate(req.body, {
        friendName: Joi.string().required(),
        tag: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const result = await User.updateOne({ _id: req.user._id, 'friends.name': req.body.friendName }, {
        $set: {
            'friends.$.tag': req.body.tag,
        }
    });

    if (result.nModified == 0) {
        await User.updateOne({ _id: req.user._id }, {
            $push: {
                friends: {
                    name: req.body.friendName,
                    tag: req.body.tag,
                }
            }
        });
    }

    res.status(200).send(__.success('Tag added to friend'));
};

const removeFriend = async (req, res) => {
    const error = __.validate(req.body, {
        friendName: Joi.string().required()
    });

    await User.updateOne({ _id: req.user._id }, {
        $pull: { 'friends.name': req.body.name }
    });

    res.status(200).send(__.success('removed friend'));
};

const getFriendList = async (req, res) => {
    const { friends } = await User.findOne({ _id: req.user._id }, 'friends');
    res.status(200).send(__.success(friends));
};  

const getAllTagsAndFriendList = async (req, res) => {
    const { tags, friends } = await User.findOne({ _id: req.user._id }, 'tags friends');
    res.status(200).send(__.success({tags, friends}));
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/addTag', auth, addTag);
router.post('/removeTag', auth, removeTag);
router.post('/getAllTags', auth, getAllTags);
router.post('/addTagToFriend', auth, addTagToFriend);
router.post('/removeFriend', removeFriend);
router.post('/getFriendList', auth, getFriendList);
router.post('/getAllTagsAndFriendList', auth, getAllTagsAndFriendList);

module.exports = router;