const Joi = require('joi');

// basic APIs
export const updateFriendProfileData = {
  body: {
    facebookId: Joi.string().required(),
    profileData: Joi.object(),
  },
};

export const getFriendProfileData = {
  body: {
    facebookId: Joi.string().required(),
  },
};
