const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const Joi = require('joi');
let crypto = require('crypto');
const Jimp = require('jimp');
let nodemailer = require('nodemailer');
const fs = require('fs');
const base64Img = require('base64-img');
const __ = require('./appUtils');
const User = require('../schema/User');
const auth = require('../middlewares/auth');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, req.fileName);
    }
});

const fileFilter = (req, file, cb) => {
    let mt = file.mimetype;
    if (mt == 'image/jpg' || mt == 'image/jpg' || mt == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const upload = multer({ 
    storage: storage, 
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: fileFilter,
});



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

const resetPassword2 = async (req, res) => {
    const error = __.validate(req.body, {
    	email: Joi.string().required(),
	password: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error.details[0].message);

    let salt = await bcrypt.genSalt(10);
    let newPassword = await bcrypt.hash(req.body.password, salt); 

    await User.updateOne({ email: req.body.email }, {
    	$set: { password: newPassword }
    });

    res.status(200).send(__.success('Password has been reset'));
}

const forgotPassword = async (req, res) => {
    const error = __.validate(req.body, {
        email: Joi.string().email().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send(__.error('This email is not registered'));

    let token = __.generateRandom(6);
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    let smptpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'khand3826@gmail.com',
            pass: 'RealMadrid123',
        }
    });

    let mailOptions = {
        to: req.bosd.email,
        from: 'khand3826@gmail.com',
        subject: 'Pepper account password reset',
        text: `You are receiving this beacuse you (or someone else) have requested the reset of your 
        Pepper account password. \n\n Your password reset token is ${token} \n\n
        If you did not request this, please ignore this email and your password remain unchnaged.`
    };

    smptpTransport.sendMail(mailOptions, (err) => {
        if (err) return res.status(400).send(__.error('There was a problem resettign your password.'));
        res.status(200).send(__.success('An email has been send to reset your password'));
    });
};

const resetPassword = async (req, res) => {
    const error = __.validate(req.body, {
        email: Joi.string().email().required(),
        token: Joi.string().required(),
        password: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const user = await User.findOne({ email: req.bosy.email }, 'resetPasswordToken resetPasswordExpires');
    if (!user) return res.status(400).send(__.error('This email is not registered'));

    if (user.resetPasswordExpires < Date.now())
        return res.status(400).send(__.error('Reset token has been expired'));

    if (user.resetPasswordToken != req.body.token) 
        return res.status(400).send(__.error('Reset token is invalid'));
        
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    await User.update({ email: req.body.email }, {
        $set: {
            password: hashedPassword,
        }
    });

    res.status(200).send(__.success('Password has been reset successfully'));
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
    console.log(req.body);
    const error = __.validate(req.body, {
        friendId: Joi.string().required(),
        friendName: Joi.string().required(),
        tag: Joi.string().required(),
        imageUrl: Joi.string().required(),
    });
    console.log(error);
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
        $pull: { 'friends': { 'name': req.body.friendName } }
    });

    res.status(200).send(__.success('Removed friend'));
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
    console.log(req.body);
    const error = __.validate(req.body, {
        friendName: Joi.string().required(),
        note: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id, 'friends.name': req.body.friendName }, {
        $push: {
            'friends.$.notes': req.body.note,
        }
    });

    res.status(200).send(__.success('Added note to friend'));
};

const removeNoteFromFriend = async (req, res) => {
    const error = __.validate(req.body, {
        friendName: Joi.string().required(),
        note: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id, 'friends.name': req.body.friendName }, {
        $pull: {
            'friends.$.notes': req.body.note,
        }
    });

    res.status(200).send(__.success('Removed note from friend'));
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

const addImageToTemplate = async (req, res) => {
    const error = __.validate(req.body, {
        imageBase64: Joi.string().required(),
        template: Joi.string().required(),
        imageName: Joi.string().required(),
        imageType: Joi.string().required(),
    });
    if (error) return res.status(200).send(__.error(error.details[0].message));

    //let base64 = req.body.imageBase64.replace('data:' + req.body.imageType + + ';base64,', '');

    if (req.body.imageName.indexOf('--template--') < 0)
        return res.status(400).send(__.error('Image name invalid'));

    await User.updateOne({ _id: req.user._id, 'templates.name': req.body.template }, {
        $push: {
            'templates.$.messages': req.body.imageName,
        }
    });

    try {
        //let b = req.body.imageBase64.substring(base64Img.indexOf(',') + 1);
        //console.log(b);
        // let buffer = Buffer.from(b, 'base64');
        // Jimp.read(buffer, (err, image) => {
        //     if (err)
        //         console.log(err);
        //     else {
        //         image.getBase64(Jimp.MIME_PNG, function(err, src) {

        //         }).write('hello.png');
        //     }
        // });

        base64Img.img(req.body.imageBase64, 'public/temp', req.body.imageName.split('.')[0], 
            function(err, filepath) {
                if (!err)
                    res.status(200).send(__.success('Images uploaded to template'));
            }
        );
    } catch (e) {
        res.status(400).send(__.error('Base64 data invalid'));
    }
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

    if (req.body.message.indexOf('--template--') >= 0) {
        fs.unlink('public/temp/' + req.body.message, () => {
            console.log('File deleted');
        });
    }

    res.status(200).send(__.success('Message removed from template'));
}

const changeTag = async (req, res) => {
    const error = __.validate(req.body, {
        oldTag: Joi.string().required(),
        newTag: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id, 'tags.name': req.body.oldTag }, {
        $set: { 'tags.$.name': req.body.newTag }
    });

    await User.updateOne({ _id: req.user._id }, {
        $set: { 'friends.$[element].tag': req.body.newTag },
    }, { 
        arrayFilters: [{ 'element.tag': req.body.oldTag }] 
    });

    res.status(200).send(__.success('Tag changed'));
};

const changeTagColor = async (req, res) => {
    const error = __.validate(req.body, {
        tag: Joi.string().required(),
        color: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.user._id, 'tags.name': req.body.tag }, {
        $set: { 'tags.$.color': req.body.color }
    });

    res.status(200).send(__.success('Tag color changed'));
};

const changeTemplateOrder = async (req, res) => {
    const error = __.validate(req.body, {
        i1: Joi.number().integer().required(),
        i2: Joi.number().integer().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let i1 = Number(req.body.i1),
        i2 = Number(req.body.i2);

    let { templates } = await User.findOne({ _id: req.user._id }, 'templates');

    let tmp = templates[i1];
    templates.splice(i1, 1);
    templates.splice(i2, 0, tmp);

    await User.updateOne({ _id: req.user._id }, {
        $set: { templates: templates }
    });

    res.status(200).send(__.success('Templates reordered'));


    // const result = await User.findOne({ _id: req.user._id }, {
    //     array: { $slice: [req.body.i1, 1] }
    // });
    // let template = result.templates[0];

    // await User.updateOne({ _id: req.user._id }, {
    //     $unset: { ['templates.' + i1]: 1 }
    // });
    // await User.updateOne({ _id: req.user._id }, {
    //     $pull: { 
    //         templates: {
    //             $in: [ null ]
    //         }
    //     }
    // });

    // await User.updateOne({ _id: req.user._id }, {
    //     $push: {
    //         templates: {
    //             $each: [
    //                 template
    //             ],
    //             $position: i2
    //         }
    //     }
    // });

    // res.status(200).send(__.success('Template order changed'));
};

const changeMessageOrder = async (req, res) => {
    const error = __.validate(req.body, {
        template: Joi.string().required(),
        i1: Joi.number().integer().required(),
        i2: Joi.number().integer().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let t = req.body.template,
        i1 = Number(req.body.i1),
        i2 = Number(req.body.i2);
    
    const result = await User.findOne({ _id: req.user._id, 'templates.name': t }, 
        { 'templates.$': 1 });
    let messages = result.templates[0].messages;

    let tmp = messages[i1];
    messages.splice(i1, 1);
    messages.splice(i2, 0, tmp);

    await User.updateOne({ _id: req.user._id, 'templates.name': t }, {
        $set: {
            'templates.$.messages': messages
        }
    });

    res.status(200).send(__.success('Messages order changed'));
};

const changeTagOrder = async (req, res) => {
    const error = __.validate(req.body, {
        i1: Joi.number().required(),
        i2: Joi.number().required()
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let i1 = Number(req.body.i1),
        i2 = Number(req.body.i2);

    const { tags } = await User.findOne({ _id: req.user._id }, 'tags');

    let tmp = tags[i1];
    tags.splice(i1, 1);
    tags.splice(i2, 0, tmp);

    await User.updateOne({ _id: req.user._id }, {
        $set: { tags: tags }
    });

    res.status(200).send(__.success('Tags order changed'));
};

const changeTemplate = async (req, res) => {
    const error = __.validate(req.body, {
        oldTemplate: Joi.string().required(),
        newTemplate: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error.details[0].message);

    await User.updateOne({ _id: req.user._id, 'templates.name': req.body.oldTemplate }, {
        $set: { 
            'templates.$.name': req.body.newTemplate,
        }
    });

    res.status(200).send(__.success('Template changed'));
};

const changeMessage = async (req, res) => {
    const error = __.validate(req.body, {
        index: Joi.number().required(),
        template: Joi.string().required(),
        newMessage: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({
        _id: req.user._id,
        'templates.name': req.body.template,
    }, {
        $set: { ['templates.$.messages.' + req.body.index]: req.body.newMessage }
    });

    res.status(200).send(__.success('Message changed'));
}


router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword2);
router.post('/addTag', auth, addTag);
router.post('/removeTag', auth, removeTag);
router.post('/getAllTags', auth, getAllTags);
router.post('/addTagToFriend', auth, addTagToFriend);
router.post('/removeFriend', auth, removeFriend);
router.post('/getFriendList', auth, getFriendList);
router.post('/loadData', auth, loadData);
router.post('/updateTagsAndFriends', auth, updateTagsAndFriends);
router.post('/addNoteToFriend', auth, addNoteToFriend);
router.post('/removeNoteFromFriend', auth, removeNoteFromFriend);
router.post('/addMessage', auth, addMessage);
router.post('/removeTemplate', auth, removeTemplate);
router.post('/addTemplate', auth, addTemplate);
router.post('/addMessageToTemplate', auth, addMessageToTemplate);
router.post('/addImageToTemplate', auth, addImageToTemplate);
router.post('/removeMessageFromTemplate', auth, removeMessageFromTemplate);
router.post('/changeTag', auth, changeTag);
router.post('/changeTagColor', auth, changeTagColor);
router.post('/changeTemplateOrder', auth, changeTemplateOrder);
router.post('/changeMessageOrder', auth, changeMessageOrder);
router.post('/changeTagOrder', auth, changeTagOrder);
router.post('/changeTemplate', auth, changeTemplate);
router.post('/changeMessage', auth, changeMessage);

module.exports = router;
