/* eslint-disable no-underscore-dangle */

import { successResponse, errorResponse } from '../../helpers/appUtils';
import User from '../../models/User';
import FriendProfile from '../../models/FriendProfile';

const defaultfriendProfileData = {
  description: '',
  company: '',
  dealValue: '',
  profileData: {},
};

export const updateFriendProfileData = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.user._id });
    if (!userData) {
      return errorResponse(req, res, 'User not found!', 400);
    }
    const existingData = await FriendProfile.findOne({
      facebookId: req.body.facebookId,
      user: userData.id,
    });
    let friendProfileData;
    const updatedealValue = req.body.dealValue ? req.body.dealValue : '';
    const updateCompany = req.body.company ? req.body.company : '';
    const updateDescription = req.body.description ? req.body.description : '';
    if (existingData) {
      friendProfileData = {
        description: updateDescription,
        company: updateCompany,
        dealValue: updatedealValue,
        profileData: req.body.profileData ? req.body.profileData : {},
      };
      await FriendProfile.updateOne({
        facebookId: req.body.facebookId,
        user: userData._id,
      }, friendProfileData);
    } else {
      friendProfileData = {
        user: userData.id,
        facebookId: req.body.facebookId,
        description: updateDescription,
        company: updateCompany,
        dealValue: updatedealValue,
        profileData: req.body.profileData ? req.body.profileData : {},
      };
      const newFriendProfile = new FriendProfile(friendProfileData);
      await newFriendProfile.save();
      delete friendProfileData.user;
    }
    await User.updateOne({ _id: req.user._id, 'friends.id': req.body.facebookId }, {
      $set: {
        'friends.$.company': updateCompany,
        'friends.$.dealValue': updatedealValue,
      },
    });
    return successResponse(req, res, friendProfileData);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

export const getFriendProfileData = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.user._id });
    if (!userData) {
      return errorResponse(req, res, 'User not found!', 400);
    }
    let friendProfileData = await FriendProfile.findOne({
      facebookId: req.body.facebookId,
      user: userData._id,
    }, {
      _id: 0,
      __v: 0,
      user: 0,
    });
    if (!friendProfileData) friendProfileData = defaultfriendProfileData;

    return successResponse(req, res, friendProfileData);
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};
