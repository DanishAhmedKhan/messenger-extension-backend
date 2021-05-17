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
    if (existingData) {
      friendProfileData = {
        description: req.body.description ? req.body.description : existingData.description,
        company: req.body.company ? req.body.company : existingData.company,
        dealValue: req.body.dealValue ? req.body.dealValue : existingData.dealValue,
        profileData: req.body.profileData ? req.body.profileData : existingData.profileData,
      };
      await FriendProfile.updateOne({
        facebookId: req.body.facebookId,
        user: userData._id,
      }, friendProfileData);
    } else {
      friendProfileData = {
        user: userData.id,
        facebookId: req.body.facebookId,
        description: req.body.description ? req.body.description : '',
        company: req.body.company ? req.body.company : '',
        dealValue: req.body.dealValue ? req.body.dealValue : '',
        profileData: req.body.profileData ? req.body.profileData : {},
      };
      const newFriendProfile = new FriendProfile(friendProfileData);
      await newFriendProfile.save();
      delete friendProfileData.user;
    }
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
