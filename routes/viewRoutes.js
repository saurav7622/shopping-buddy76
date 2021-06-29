const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.get('/', viewsController.getOverview);
router.get('/login',  viewsController.getLoginForm);
router.get('/signup',viewsController.getSignUpForm);
router.get('/resetPassword',viewsController.getResetPasswordForm);
router.get('/forgotPasswordForm',viewsController.getForgotPasswordForm);
router.get('/currentStatus',viewsController.getCurrentStatus);
module.exports = router;
