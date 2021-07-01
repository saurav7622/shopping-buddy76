const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const viewsController = require('./../controllers/viewsController');
const { route } = require('./viewRoutes');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout',authController.logout);
router.post('/addNotifications',authController.addNotifications);
router.get('/getAllUsers',userController.getAllUsers);
//router.post('/trackPrice',authController.trackPrice);
router.patch('/updateMyPassword',authController.updatePassword);
router.post('/forgotPassword',authController.forgotPassword);
router.get('/resetPassword/:token',viewsController.getForgottenPasswordResetForm);
router.patch('/resetPassword/:token',authController.resetPassword);
module.exports = router;
