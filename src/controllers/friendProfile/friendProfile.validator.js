const Joi = require('joi');

// basic APIs
export const updateFriendProfileData = {
  body: {
    facebookId: Joi.string().required(),
    // name: Joi.string().required(),
    description: Joi.string(),
    company: Joi.string(),
    dealValue: Joi.string(),
    profileData: Joi.object(),
  },
};

export const getFriendProfileData = {
  body: {
    facebookId: Joi.string().required(),
  },
};
