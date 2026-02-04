import express from 'express';
const router = express.Router();
import { uploadMiddleware } from '../utils/uploadMiddleware.js';
import { protect } from '../middleware/requireAuth.js';
import {
	signinUser,
	loginUser,
	refreshToken,
	getUsers,
	updateProfile,
	updateUserProfile,
	updateProfileImage,
	forgetPassword,
	resetPassword,
	changePassword,
	updatePassword,
	deleteUser,
	sendOTP,
	verifyOTP,
	adminUpdatePassword,
} from '../controllers/user.js';

// // get user
router.get('/', protect, getUsers);
router.post('/register', signinUser);
router.post('/login', loginUser);
// logout user
router.post('/logout', loginUser);

// //get new token
router.post('/refresh-token', refreshToken);

// //forget Password link to mail
router.post('/forgot-password', forgetPassword);

// //send otp to mail
router.post('/send-otp', sendOTP);

// //verify otp
router.post('/verify-otp', verifyOTP);

// // //resetPassword
router.get('/reset-password/:token', resetPassword);
router.use(protect);

// // //change Password
router.post('/change-password', protect, changePassword);
router.patch('/admin-update-password', protect, adminUpdatePassword);

// // //update Password
router.patch('/update-password', protect, updatePassword);

// // //update user profile
router.patch('/update-profile', protect, uploadMiddleware, updateProfile);

// // //update user profile with image or without image
router.patch('/update-user-profile', updateUserProfile);

// // //update user profile with image
router.patch('/update-profile-image', uploadMiddleware, updateProfileImage);

// Authenticate user
// router.use(protect);

// //new user
// router.post('/update', updateProfile);

router.delete('/delete-account', protect, deleteUser);

export default router;
