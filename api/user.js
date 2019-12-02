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
    const authToken = newUser.generateAuthToken();

    res.header('x-user-auth-token', authToken)
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

    await User.updateOne({ _id: req.user._id }, {
        $set: { 'friends.$[element].tag': '...' }
    }, {
        arrayFilters: [{ 'element.tag': req.body.name }]
    });

    res.status(200).send(__.success('Tag removed'));
};

const getAllTags = async (req, res) => {
    const { tags } = await User.findOne({ _id: req.user._id }, 'tags');
    return res.status(200).send(__.success(tags));
};

const addTagToFriend = async (req, res) => {
    const error = __.validate(req.body, {
        friendId: Joi.string().required(),
        friendName: Joi.string().required(),
        tag: Joi.string().required(),
        imageUrl: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const result = await User.updateOne({ _id: req.user._id, 'friends.id': req.body.friendId }, {
        $set: {
            'friends.$.name': req.body.friendName,
            'friends.$.tag': req.body.tag,
            'friends.$.imageUrl': req.body.imageUrl,
        }
    });

    if (result.nModified == 0) {
        await User.updateOne({ _id: req.user._id }, {
            $push: {
                friends: {
                    id: req.body.friendId,
                    name: req.body.friendName,
                    tag: req.body.tag,
                    imageUrl: req.body.imageUrl,
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
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id }, {
        $pull: { 'friends.name': req.body.name }
    });

    res.status(200).send(__.success('removed friend'));
};

const removeMultipleFriends = async (req, res) => {
    const error = __.validate(req.body, {
        friendsName: Joi.array().items(Joi.string())
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    friendsArray = [];
    for (let i = 0; i < req.body.friendsName.length; i++) {
        friendsArray.push({ name: req.body.friendsName[i], tag: '...' });
    }

    await User.updateOne({ _id: req.user._id }, {
        $push: { friends: { $each: friendsArray } }
    });

    res.status(200).send(__.success('Removed multiple friends'));
};

const getFriendList = async (req, res) => {
    const { friends } = await User.findOne({ _id: req.user._id }, 'friends');
    res.status(200).send(__.success(friends));
};  

const loadData = async (req, res) => {
    const { tags, friends, templates } = await User.findOne({ _id: req.user._id }, 'tags friends templates');
    res.status(200).send(__.success({tags, friends, templates}));
};

const updateTagsAndFriends = async (req, res) => {
    const error = __.validate(req.body, {
        tags: Joi.array().items(Joi.object().keys({
            name: Joi.string(),
            color: Joi.string(),
        })),
        tags: Joi.array().items(Joi.object().keys({
            name: Joi.string(),
            tag: Joi.string(),
        })),
    });
    if (error) return res.status(200).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id }, {
        $set: {
            tags: req.body.tags,
            friends: req.body.friends,
        }
    });

    req.status(200).send(__.success('Updated tags and friends'));
};

const addNoteToFriend = async (req, res) => {
    const error = __.validate(req.body, {
        friendName: Joi.string().required(),
        note: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id, 'friends.name': req.body.friendName }, {
        $push : {
            'friends.$.notes': req.body.note,
        }
    });

    res.status(200).send(__.success('Added note to friend'));
};

const addMessage = async (req, res) => {
    const error = __.validate(req.body, {
        message: Joi.string().required(),
    });

    await User.updateOne({ _id: req.user._id }, {
        $push: { messages: req.body.message }
    });

    res.status(200).send(__.success('Message added'));
};

const addTemplate = async (req, res) => {
    const error = __.validate(req.body, {
        template: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id }, {
        $push: { templates: { name: req.body.template } }
    });

    return res.status(200).send(__.success('New template added'));
};

const removeTemplate = async (req, res) => {
    const error = __.validate(req.body, {
        template: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id }, {
        $pull: { 'templates': { name: req.body.template } }
    });

    res.status(200).send(__.success('Removed template'));
};

const addMessageToTemplate = async (req, res) => {
    const error = __.validate(req.body, {
        template: Joi.string().required(),
        message: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id, 'templates.name': req.body.template }, {
        $push: {
            'templates.$.messages': req.body.message
        }
    });

    res.status(200).send(__.success('Message added to template'));
};  

const removeMessageFromTemplate = async (req, res) => {
    const error = __.validate(req.body, {
        template: Joi.string().required(),
        message: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id, 'templates.name': req.body.template }, {
        $pull: {
            'templates.$.messages': req.body.message
        }
    });

    res.status(200).send(__.success('Message removed from template'));
}

router.post('/signup', signup);
router.post('/login', login);
router.post('/addTag', auth, addTag);
router.post('/removeTag', auth, removeTag);
router.post('/getAllTags', auth, getAllTags);
router.post('/addTagToFriend', auth, addTagToFriend);
router.post('/removeFriend', removeFriend);
router.post('/getFriendList', auth, getFriendList);
router.post('/loadData', auth, loadData);
router.post('/updateTagsAndFriends', auth, updateTagsAndFriends);
router.post('/addNoteToFriend', auth, addNoteToFriend);
router.post('/addMessage', auth, addMessage);
router.post('/removeTemplate', auth, removeTemplate);
router.post('/addTemplate', auth, addTemplate);
router.post('/addMessageToTemplate', auth, addMessageToTemplate);
router.post('/removeMessageFromTemplate', auth, removeMessageFromTemplate);

module.exports = router;