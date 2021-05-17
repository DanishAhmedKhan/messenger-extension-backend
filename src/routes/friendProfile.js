import express from 'express';
import validate from 'express-validation';
import auth from '../middlewares/auth';
import * as friendController from '../controllers/friendProfile/friendProfile.controller';
import * as friendValidator from '../controllers/friendProfile/friendProfile.validator';

const router = express.Router();

// basic routes
router.post('/updateFriendProfileData', auth, validate(friendValidator.updateFriendProfileData), friendController.updateFriendProfileData);
router.post('/getFriendProfileData', auth, validate(friendValidator.getFriendProfileData), friendController.getFriendProfileData);

module.exports = router;
