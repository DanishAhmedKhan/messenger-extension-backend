const Joi = require('joi');


// basic APIs
export const signup = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  },
};

export const login = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  },
};

export const resetPassword2 = {
  body: {
    email: Joi.string().required(),
    password: Joi.string().required(),
  },
};

export const forgotPassword = {
  body: {
    email: Joi.string().email().required(),
  },
};

export const resetPassword = {
  body: {
    email: Joi.string().email().required(),
    token: Joi.string().required(),
    password: Joi.string().required(),
  },
};


// Tag APIs
export const addTag = {
  body: {
    name: Joi.string().required(),
    color: Joi.string().required(),
  },
};

export const removeTag = {
  body: {
    name: Joi.string().required(),
  },
};

export const addTagToFriend = {
  body: {
    friendId: Joi.string().required(),
    friendName: Joi.string().required(),
    tag: Joi.string().required(),
    imageUrl: Joi.string().required(),
  },
};

export const changeTag = {
  body: {
    oldTag: Joi.string().required(),
    newTag: Joi.string().required(),
  },
};

export const changeTagColor = {
  body: {
    tag: Joi.string().required(),
    color: Joi.string().required(),
  },
};

export const changeTagOrder = {
  body: {
    i1: Joi.number().required(),
    i2: Joi.number().required(),
  },
};


// Friend APIs
export const removeFriend = {
  body: {
    friendName: Joi.string().required(),
  },
};

export const removeMultipleFriends = {
  body: {
    friendsName: Joi.array().items(Joi.string()),
  },
};
// ask danish for confirmation
export const updateTagsAndFriends = {
  body: {
    tags: Joi.array().items(Joi.object().keys({
      name: Joi.string(),
      color: Joi.string(),
    })),
    friends: Joi.array().items(Joi.object().keys({
      name: Joi.string(),
      tag: Joi.string(),
    })),
  },
};

export const updateFriendList = {
  body: {
    friendList: Joi.array().items(Joi.object().keys({
      notes: Joi.array(),
      id: Joi.string(),
      uniqeId: Joi.string(),
      imageUrl: Joi.string(),
      name: Joi.string(),
      tag: Joi.string(),
    })),
  },
};

export const addNoteToFriend = {
  body: {
    friendName: Joi.string().required(),
    note: Joi.string().required(),
  },
};

export const removeNoteFromFriend = {
  body: {
    friendName: Joi.string().required(),
    note: Joi.string().required(),
  },
};

// template APIs
export const addTemplate = {
  body: {
    template: Joi.string().required(),
  },
};

export const removeTemplate = {
  body: {
    template: Joi.string().required(),
  },
};

export const addImageToTemplate = {
  body: {
    imageBase64: Joi.string().required(),
    template: Joi.string().required(),
    imageName: Joi.string().required(),
    imageType: Joi.string().required(),
  },
};

export const changeTemplateOrder = {
  body: {
    i1: Joi.number().integer().required(),
    i2: Joi.number().integer().required(),
  },
};

export const changeTemplate = {
  body: {
    oldTemplate: Joi.string().required(),
    newTemplate: Joi.string().required(),
  },
};

// message APIs
export const addMessage = {
  body: {
    message: Joi.string().required(),
  },
};

export const changeMessage = {
  body: {
    index: Joi.number().required(),
    template: Joi.string().required(),
    newMessage: Joi.string().required(),
  },
};

export const removeMessageFromTemplate = {
  body: {
    template: Joi.string().required(),
    message: Joi.string().required(),
  },
};

export const addMessageToTemplate = {
  body: {
    template: Joi.string().required(),
    message: Joi.string().required(),
  },
};

export const changeMessageOrder = {
  body: {
    template: Joi.string().required(),
    i1: Joi.number().integer().required(),
    i2: Joi.number().integer().required(),
  },
};
