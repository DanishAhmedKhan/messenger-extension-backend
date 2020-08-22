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
router.post('/removeFriend', auth, validate(userValidator.removeFriend), userController.removeFriend); // needs change as depends on Name
router.post('/updateTagsAndFriends', auth, validate(userValidator.updateTagsAndFriends), userController.updateTagsAndFriends);// not in use
router.post('/updateFriendList', auth, validate(userValidator.updateFriendList), userController.updateFriendList);// to update entire friendList

router.post('/getFriendList', auth, userController.getFriendList);

router.post('/addNoteToFriend', auth, validate(userValidator.addNoteToFriend), userController.addNoteToFriend); // needs change as depends on Name
router.post('/removeNoteFromFriend', auth, validate(userValidator.removeNoteFromFriend), userController.removeNoteFromFriend); // needs change as depends on Name


// template routes
router.post('/addTemplate', auth, validate(userValidator.addTemplate), userController.addTemplate);
router.post('/removeTemplate', auth, validate(userValidator.removeTemplate), userController.removeTemplate);
router.post('/addMessageToTemplate', auth, validate(userValidator.addMessageToTemplate), userController.addMessageToTemplate);
router.post('/addImageToTemplate', auth, validate(userValidator.addImageToTemplate), userController.addImageToTemplate); // needs S3 Change
router.post('/removeMessageFromTemplate', auth, validate(userValidator.removeMessageFromTemplate), userController.removeMessageFromTemplate);
router.post('/changeTemplateOrder', auth, validate(userValidator.changeTemplateOrder), userController.changeTemplateOrder);
router.post('/changeTemplate', auth, validate(userValidator.changeTemplate), userController.changeTemplate);

// message routes
router.post('/addMessage', auth, validate(userValidator.addMessage), userController.addMessage);
router.post('/changeMessage', auth, validate(userValidator.changeMessage), userController.changeMessage);
router.post('/changeMessageOrder', auth, validate(userValidator.changeMessageOrder), userController.changeMessageOrder);


module.exports = router;
