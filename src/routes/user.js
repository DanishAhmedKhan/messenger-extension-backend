import express from 'express';
import validate from 'express-validation';
import auth from '../middlewares/auth';
import * as userController from '../controllers/user.controller';
import * as userValidator from '../controllers/user.validator';

const router = express.Router();

// basic routes
router.post('/signup', validate(userValidator.signup), userController.signup);
router.post('/login', validate(userValidator.login), userController.login);
router.post('/forgotPassword', validate(userValidator.forgotPassword), userController.forgotPassword);
router.post('/resetPassword', validate(userValidator.resetPassword2), userController.resetPassword2);

// tag related routes
router.post('/addTag', auth, validate(userValidator.addTag), userController.addTag);
router.post('/removeTag', auth, validate(userValidator.removeTag), userController.removeTag);
router.post('/getAllTags', auth, userController.getAllTags);
router.post('/addTagToFriend', auth, validate(userValidator.addTagToFriend), userController.addTagToFriend);
router.post('/changeTag', auth, validate(userValidator.changeTag), userController.changeTag);
router.post('/changeTagColor', auth, validate(userValidator.changeTagColor), userController.changeTagColor);
router.post('/changeTagOrder', auth, validate(userValidator.changeTagOrder), userController.changeTagOrder);

// load user data
router.post('/loadData', auth, userController.loadData);

// friend routes
router.post('/removeFriend', auth, userController.removeFriend);
router.post('/getFriendList', auth, userController.getFriendList);
router.post('/updateTagsAndFriends', auth, userController.updateTagsAndFriends);
router.post('/addNoteToFriend', auth, userController.addNoteToFriend);
router.post('/removeNoteFromFriend', auth, userController.removeNoteFromFriend);

// template routes
router.post('/addTemplate', auth, userController.addTemplate);
router.post('/removeTemplate', auth, userController.removeTemplate);
router.post('/addMessageToTemplate', auth, userController.addMessageToTemplate);
router.post('/addImageToTemplate', auth, userController.addImageToTemplate);
router.post('/removeMessageFromTemplate', auth, userController.removeMessageFromTemplate);
router.post('/changeTemplateOrder', auth, userController.changeTemplateOrder);
router.post('/changeTemplate', auth, userController.changeTemplate);

// message routes
router.post('/addMessage', auth, userController.addMessage);
router.post('/changeMessage', auth, userController.changeMessage);
router.post('/changeMessageOrder', auth, userController.changeMessageOrder);


module.exports = router;
