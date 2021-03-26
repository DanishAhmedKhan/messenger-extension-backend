/* eslint-disable no-underscore-dangle */
import { successResponse, errorResponse } from '../helpers/appUtils';

const bcrypt = require('bcryptjs');
const multer = require('multer');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const fs = require('fs');
const base64Img = require('base64-img');
const __ = require('../helpers/appUtils');
const User = require('../models/User');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, './public/uploads/');
  },
  filename(req, file, cb) {
    cb(null, req.fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const mt = file.mimetype;
  if (mt === 'image/jpg' || mt === 'image/jpg' || mt === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter,
});

// basic APIs
export const signup = async (req, res) => {
  try {
    let user;
    user = await User.findOne({ email: String(req.body.email).toLowerCase() });
    if (user) return errorResponse(req, res, 'Email already registered !', 400);

    user = {
      email: String(req.body.email).toLowerCase(),
      password: req.body.password,
    };

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    const newUser = new User(user);
    await newUser.save();
    const authToken = newUser.generateAuthToken();

    res.header('x-user-auth-token', authToken);
    return successResponse(req, res, 'Signed up.');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: String(req.body.email).toLowerCase() }, 'password');
    if (!user) return errorResponse(req, res, 'This email is not registered', 400);

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return errorResponse(req, res, 'Invalid password !', 400);

    const authToken = user.generateAuthToken();
    res.header('x-user-auth-token', authToken);
    return successResponse(req, res, 'Loged in.');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return errorResponse(req, res, 'This email is not registered', 400);

    const token = __.generateRandom(6);
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const smptpTransport = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'khand3826@gmail.com',
        pass: 'RealMadrid123',
      },
    });

    const mailOptions = {
      to: req.body.email,
      from: 'khand3826@gmail.com',
      subject: 'Pepper account password reset',
      text: `You are receiving this beacuse you (or someone else) have requested the reset of your 
        Pepper account password. \n\n Your password reset token is ${token} \n\n
        If you did not request this, please ignore this email and your password remain unchnaged.`,
    };

    await smptpTransport.sendMail(mailOptions);

    return successResponse(req, res, 'An email has been send to reset your password');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const resetPassword2 = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(req.body.password, salt);

    await User.updateOne({ email: req.body.email }, {
      $set: { password: newPassword },
    });

    return successResponse(req, res, 'Password has been reset');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

// export const resetPassword = async (req, res) => {
//   const error = __.validate(req.body, {
//     email: Joi.string().email().required(),
//     token: Joi.string().required(),
//     password: Joi.string().required(),
//   });
//   if (error) return res.status(400).send(__.error(error.details[0].message));

//   const user = await User.findOne({ email: req.bosy.email }, 'resetPasswordToken resetPasswordExpires');
//   if (!user) return res.status(400).send(__.error('This email is not registered'));

//   if (user.resetPasswordExpires < Date.now()) { return res.status(400).send(__.error('Reset token has been expired')); }

//   if (user.resetPasswordToken != req.body.token) { return res.status(400).send(__.error('Reset token is invalid')); }

//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(req.body.password, salt);

//   await User.update({ email: req.body.email }, {
//     $set: {
//       password: hashedPassword,
//     },
//   });

//   res.status(200).send(__.success('Password has been reset successfully'));
// };

// load user Data
export const loadData = async (req, res) => {
  try {
    const data = await User.findOne({ _id: req.user._id });
    if (!data) {
      return errorResponse(req, res, 'User not found!', 400);
    }
    const {
      tags, friends, templates, isDatasync,
    } = data;
    return successResponse(req, res, {
      tags, friends, templates, isDatasync,
    });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

// Tag APIs
export const addTag = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, {
      $push: {
        tags: {
          name: req.body.name,
          color: req.body.color,
        },
      },
    });

    return successResponse(req, res, 'Tags added');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const removeTag = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, {
      $pull: { tags: { name: req.body.name } },
    });

    await User.updateOne({ _id: req.user._id }, {
      $set: { 'friends.$[element].tag': '...' },
    }, {
      arrayFilters: [{ 'element.tag': req.body.name }],
    });

    return successResponse(req, res, 'Tag removed');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const getAllTags = async (req, res) => {
  try {
    const { tags } = await User.findOne({ _id: req.user._id }, 'tags');
    return successResponse(req, res, tags);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const addTagToFriend = async (req, res) => {
  try {
    if (req.body.uniqeId && req.body.isSync) {
      const updateResult = await User.updateOne({ _id: req.user._id, 'friends.id': req.body.friendId }, {
        $set: {
          'friends.$.name': req.body.friendName,
          'friends.$.uniqeId': req.body.uniqeId,
          'friends.$.isSync': req.body.isSync,
          'friends.$.tag': req.body.tag,
          'friends.$.imageUrl': req.body.imageUrl,
        },
      });
      if (updateResult.nModified === 0) {
        await User.updateOne({ _id: req.user._id }, {
          $push: {
            friends: {
              id: req.body.friendId,
              name: req.body.friendName,
              tag: req.body.tag,
              imageUrl: req.body.imageUrl,
              isSync: req.body.isSync,
              uniqeId: req.body.uniqeId,
            },
          },
        });
      }
      return successResponse(req, res, 'Tag added to friend');
    }
    const result = await User.updateOne({ _id: req.user._id, 'friends.id': req.body.friendId }, {
      $set: {
        'friends.$.name': req.body.friendName,
        'friends.$.tag': req.body.tag,
        'friends.$.imageUrl': req.body.imageUrl,
      },
    });

    if (result.nModified === 0) {
      await User.updateOne({ _id: req.user._id }, {
        $push: {
          friends: {
            id: req.body.friendId,
            name: req.body.friendName,
            tag: req.body.tag,
            imageUrl: req.body.imageUrl,
          },
        },
      });
    }

    return successResponse(req, res, 'Tag added to friend');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const updateImgOfFriend = async (req, res) => {
  try {
    const result = await User.updateOne({ _id: req.user._id, 'friends.id': req.body.friendId }, {
      $set: {
        'friends.$.imageUrl': req.body.imageUrl,
      },
    });

    return successResponse(req, res, result);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const changeTag = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id, 'tags.name': req.body.oldTag }, {
      $set: { 'tags.$.name': req.body.newTag },
    });

    await User.updateOne({ _id: req.user._id }, {
      $set: { 'friends.$[element].tag': req.body.newTag },
    }, {
      arrayFilters: [{ 'element.tag': req.body.oldTag }],
    });

    return successResponse(req, res, 'Tag changed');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const changeTagColor = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id, 'tags.name': req.body.tag }, {
      $set: { 'tags.$.color': req.body.color },
    });

    return successResponse(req, res, 'Tag color changed');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const changeTagOrder = async (req, res) => {
  try {
    const i1 = Number(req.body.i1);
    const i2 = Number(req.body.i2);

    const { tags } = await User.findOne({ _id: req.user._id }, 'tags');

    const tmp = tags[i1];
    tags.splice(i1, 1);
    tags.splice(i2, 0, tmp);

    await User.updateOne({ _id: req.user._id }, {
      $set: { tags },
    });

    return successResponse(req, res, 'Tags order changed');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

// Friend APIs
export const removeFriend = async (req, res) => {
  try {
    if (req.body.friendId) {
      await User.updateOne({ _id: req.user._id }, {
        $pull: { friends: { id: req.body.friendId } },
      });
    } else {
      await User.updateOne({ _id: req.user._id }, {
        $pull: { friends: { name: req.body.friendName } },
      });
    }
    return successResponse(req, res, 'Removed friend');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const removeMultipleFriends = async (req, res) => {
  try {
    const friendsArray = [];
    for (let i = 0; i < req.body.friendsName.length; i += 1) {
      friendsArray.push({ name: req.body.friendsName[i], tag: '...' });
    }

    await User.updateOne({ _id: req.user._id }, {
      $push: { friends: { $each: friendsArray } },
    });

    return successResponse(req, res, 'Removed friend');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const getFriendList = async (req, res) => {
  try {
    const { friends } = await User.findOne({ _id: req.user._id }, 'friends');
    return successResponse(req, res, friends);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const updateTagsAndFriends = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, {
      $set: {
        tags: req.body.tags,
        friends: req.body.friends,
      },
    });

    return successResponse(req, res, 'Updated tags and friends');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const updateFriendList = async (req, res) => {
  try {
    const data = await User.findOne({ _id: req.user._id });
    if (!data) {
      return errorResponse(req, res, 'User not found!', 400);
    }
    const {
      tags, friends, templates, isDatasync,
    } = data;

    // if (friends && req.body.friendList && req.body.friendList.length > 0
    //   && friends.length === req.body.friendList.length) {
    //   await User.updateOne({ _id: req.user._id }, {
    //     $set: {
    //       friends: req.body.friendList,
    //       isDatasync: true,
    //     },
    //   });
    // }
    return successResponse(req, res, { msg: 'Updated friendList' });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const addNoteToFriend = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id, 'friends.name': req.body.friendName }, {
      $push: {
        'friends.$.notes': req.body.note,
      },
    });

    return successResponse(req, res, 'Added note to friend');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const removeNoteFromFriend = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id, 'friends.name': req.body.friendName }, {
      $pull: {
        'friends.$.notes': req.body.note,
      },
    });

    return successResponse(req, res, 'Removed note from friend');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

// template APIs
export const addTemplate = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, {
      $push: { templates: { name: req.body.template } },
    });

    return successResponse(req, res, 'New template added');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const removeTemplate = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, {
      $pull: { templates: { name: req.body.template } },
    });

    return successResponse(req, res, 'Removed template');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const addMessageToTemplate = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id, 'templates.name': req.body.template }, {
      $push: {
        'templates.$.messages': req.body.message,
      },
    });

    return successResponse(req, res, 'Message added to template');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const addImageToTemplate = async (req, res) => {
  try {
    // let base64 = req.body.imageBase64.replace('data:' + req.body.imageType + + ';base64,', '');
    if (req.body.imageName.indexOf('--template--') < 0) {
      return errorResponse(req, res, 'Image name invalid', 400);
    }

    await User.updateOne({ _id: req.user._id, 'templates.name': req.body.template }, {
      $push: {
        'templates.$.messages': req.body.imageName,
      },
    });

    base64Img.img(req.body.imageBase64, 'public/temp', req.body.imageName.split('.')[0],
      (err, filepath) => {
        if (err) throw err;
      });
    return successResponse(req, res, 'Images uploaded to template');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const changeTemplateOrder = async (req, res) => {
  try {
    const i1 = Number(req.body.i1);
    const i2 = Number(req.body.i2);

    const { templates } = await User.findOne({ _id: req.user._id }, 'templates');

    const tmp = templates[i1];
    templates.splice(i1, 1);
    templates.splice(i2, 0, tmp);

    await User.updateOne({ _id: req.user._id }, {
      $set: { templates },
    });

    return successResponse(req, res, 'Templates reordered');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const changeTemplate = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id, 'templates.name': req.body.oldTemplate }, {
      $set: {
        'templates.$.name': req.body.newTemplate,
      },
    });

    return successResponse(req, res, 'Template changed');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

// Message APIs
export const addMessage = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, {
      $push: { messages: req.body.message },
    });

    return successResponse(req, res, 'Message added');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const changeMessage = async (req, res) => {
  try {
    await User.updateOne({
      _id: req.user._id,
      'templates.name': req.body.template,
    }, {
      $set: { [`templates.$.messages.${req.body.index}`]: req.body.newMessage },
    });

    return successResponse(req, res, 'Message changed');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const removeMessageFromTemplate = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id, 'templates.name': req.body.template }, {
      $pull: {
        'templates.$.messages': req.body.message,
      },
    });

    if (req.body.message.indexOf('--template--') >= 0) {
      fs.unlink(`public/temp/${req.body.message}`, () => {
        console.log('File deleted');
      });
    }

    return successResponse(req, res, 'Message removed from template');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const changeMessageOrder = async (req, res) => {
  try {
    const t = req.body.template;
    const i1 = Number(req.body.i1);
    const i2 = Number(req.body.i2);

    const result = await User.findOne({ _id: req.user._id, 'templates.name': t },
      { 'templates.$': 1 });
    const { messages } = result.templates[0];

    const tmp = messages[i1];
    messages.splice(i1, 1);
    messages.splice(i2, 0, tmp);

    await User.updateOne({ _id: req.user._id, 'templates.name': t }, {
      $set: {
        'templates.$.messages': messages,
      },
    });

    return successResponse(req, res, 'Messages order changed');
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
