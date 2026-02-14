import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// import validator from 'validator';
import User from '../models/User.js';
import OTP from '../models/Otp.js';
// const Wallet = require('../models/walletModel');
import jwt from 'jsonwebtoken';
const verify = jwt.verify;
// import transporter from '../utils/transporter.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { resetPasswordEmail } from '../utils/emails.js';
import { uploader, cloudinary } from '../utils/cloudinary.js';
import { createToken, createRefreshToken } from '../utils/createToken.js';

// // responsivehtmlemail.com, maizzle
import nodemailer from 'nodemailer';
// // login user
export const refreshToken = async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) throw { message: 'refresh Token error' };
		const decode = verify(refreshToken, process.env.REFRESH_SECRET);
		const userId = decode._id;
		const token = createToken(userId);
		const refToken = createRefreshToken(userId);

		res.status(200).send({
			token,
			refreshToken: refToken,
		});
	} catch (error) {
		next(error);
	}
};

export const loginUser = async (req, res) => {
	const { email, password } = req.body;

	try {
		if (!email || !password) {
			return res
				.status(400)
				.json({ message: 'Email and password are required fields.' });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: 'Invalid email or password.' });
		}

		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return res.status(401).json({ message: 'Invalid email or password.' });
		}

		const token = createToken(user._id);
		const refreshToken = createRefreshToken(user._id);

		return res.status(200).json({
			user: {
				...user._doc,
				token,
				refreshToken,
			},
			message: 'Logged in successfully.',
		});
	} catch (error) {
		return res
			.status(500)
			.json({ error: error.message || 'Internal server error.' });
	}
};

export const getUsers = async (req, res) => {
	try {
		const userId = req.user._id;
		const users = await User.find({ _id: { $ne: userId } }).select('-password');
		res.status(200).json(users);
	} catch (error) {
		res.status(404).json({ message: error.message });
	}
};

// // signinUser
export const signinUser = async (req, res) => {
	const { name, email, password, role = 'user' } = req.body;
	try {
		if (!name) {
			return res.status(404).json({ error: 'Name is required' });
		}
		if (!password) {
			return res.status(404).json({ error: 'Password is required' });
		}
		if (!email) {
			res.status(404).json({ error: 'Email Number is required' });
		}

		if (!(password.length > 4)) {
			return res.status(404).json({ error: 'Input a strong password' });
		}

		const emailexists = await User.findOne({ email });

		if (emailexists) {
			return res.status(404).json({ error: 'Email Address already Exists' });
		}

		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(password, salt);

		const user = await User.create({ name, email, password: hash, role });
		// create a token
		const token = createToken(user._id);
		const refreshToken = createRefreshToken(user._id);

		return res.status(200).json({
			user,
			token,
			refreshToken,
			message: 'Account created successfully',
		});
	} catch (error) {
		console.log(error);
		res.status(404).json({ error: error.message });
	}
};

// //send mail
export const sendEmail = async (req, res) => {
	try {
		const { email } = req.body;
		const checkUser = User.findOne({ email });
		if (checkUser) {
			const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

			const salt = 10;
			const hashedOTP = await bcrypt.hash(otp, salt);
			const currentTime = new Date().getTime();

			const savedOTP = new OTP({
				otp: hashedOTP,
				email: email,
				createdWhen: `${currentTime}`,
				// expiresWhen: `${currentTime + 600000}`,
				expiresWhen: `${currentTime + 60000000}`,
			});
			const token = createToken(email);
			await savedOTP.save();

			const link = `${process.env.BASE_URL}/verify-otp/${token}/${email}`;

			const mailoption = {
				from: `${process.env.SENDERMAIL}`, // sender address
				to: email, // receivers address
				subject: 'Email for  OTP Verication', // Subject line
				text: `Verify your Account by using this OTP: ${otp} valid for 10 Minutes.`, // plain text body
				html: resetPasswordEmail({ otp, link, userName: checkUser.name }),
			};

			nodemailer
				.createTransport({
					service: 'gmail',
					auth: {
						user: process.env.EMAIL,
						pass: process.env.PASSWORD,
					},
				})
				.sendMail(mailoption, (error, info) => {
					if (error) {
						// console.log(error, "error");
						res.status(401).json({
							error: error,
							message: 'Error sending OTP code',
						});
					} else {
						// console.log(info.response, "success");
						res.status(200).json({
							info,
							token,
							email,
							message: 'OTP code sent successfully',
						});
					}
				});
		}
	} catch (error) {
		console.log(error);
		res.status(401).json({
			error,
			status: 'FAILED',
			message: 'Verication FAILED to send to Email',
		});
	}
};

export const sendOTP = async (req, res) => {
	const { email } = req.body;
	const checkOTPUser = await OTP.findOne({ email });
	if (checkOTPUser) {
		await OTP.deleteOne({ email });
		return sendEmail(req, res);
	} else {
		return sendEmail(req, res);
	}
};
// verify with token
export const verifyOTP = async (req, res) => {
	const { token, otp, email } = req.body;

	if (!token || !otp) {
		res.status(401).json({ msg: 'please provide valid credentials' });
	} else {
		// // verify the token
		const verify = jwt.verify(token, process.env.SECRET);
		if (!verify) {
			return res.status(401).json({ message: 'OTP Verification failed' });
		}
		const user = await User.findOne({ email });

		if (!user) {
			res.status(401).json({ message: 'User not found' });
		} else {
			const otpUser = await OTP.findOne({ email: user.email });
			const otpVerify = otpUser.otp;
			const userLL = bcrypt.compare(otp, otpVerify);
			const exp = otpUser.expiresWhen;

			if (Number(exp) > Number(Date.now()) && userLL) {
				const token = createToken(user._id);
				res.status(200).json({ message: 'User Verified!', token });
			} else {
				await OTP.deleteMany({ email });
				res.status(401).json({ message: 'User OTP expired' });
			}
		}
	}
};
// // verify with email
export const verifyOtp = async (req, res) => {
	const { email, otp, token } = req.body;

	if (!email || !otp) {
		res.status(401).json({ msg: 'please provide valid credentials' });
	} else {
		const user = await User.checkMail(email);
		const otpUser = await OTP.findOne({ email });

		if (!user) {
			res.status(401).json({ message: 'User not found' });
		} else {
			const otpVerify = otpUser.otp;
			const userLL = bcrypt.compare(otp, otpVerify);
			const exp = otpUser.expiresWhen;

			if (Number(exp) > Number(Date.now()) && userLL) {
				const token = createToken(user._id);
				res
					.status(200)
					.json({ message: 'User Verified!', AccessToken: token, token });
			} else {
				await OTP.deleteMany({ email });
				res.status(401).json({ message: 'User OTP expired' });
			}
		}
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { body, file } = req;
		let user;
		user = await User.findById(req.user._id, { new: true });
		if (file) {
			if (user.image.public_id) {
				const deleteImage = await cloudinary.uploader.destroy(
					user.image.public_id,
				);
				console.log(deleteImage);
			}
			const image = await uploader(req.file.path, 'user-images');
			await fs.promises.unlink(req.file.path);
			// Save the updated user to the database
			user.image = image;
			await user.save();
			// user = await User.findByIdAndUpdate(user._id, image, { new: true });
		}
		const allowedFields = ['name', 'email', 'phone', 'role'];

		const updateData = {};

		allowedFields.forEach((field) => {
			if (body[field] !== undefined) updateData[field] = body[field];
		});

		const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			user: updatedUser,
			message: 'User profile updated successfully',
		});
	} catch (error) {
		console.log(error);
		if (req.file) {
			await fs.promises.unlink(req.file.path);
		}
		res.status(500).json({ error: error || error.message });
	}
};

// // update user profile with image
export const updateProfileImage = async (req, res) => {
	const { name, phone, email, address } = JSON.parse(req.body.user);
	console.log(name, phone, email, address);
	try {
		const image = req.files.image;
		const fileName = new Date().getTime().toString() + path.extname(image.name);
		const savePath = path.join(__dirname, 'public', 'users', fileName);
		await image.mv(savePath);
		let user = await User.findOne({ _id: id });
		if (!user) {
			res.status(404).json({ error: 'user does not exist!!' });
		}
		if (user) {
			user.name = name || req.body.name || user.name;
			user.phone = phone || req.bodyphone || user.phone;
			user.address = address || req.body.address || user.address;
			user.email = email || req.body.email || user.email;
			user.image = fileName;
		}
		user = await user.save();
		res.status(200).json({ message: 'image upload Successfully' });
	} catch (error) {
		res.status(404).json({ error: error.message });
	}
};
// update user without image
export const updateUserProfile = async (req, res) => {
	const { id } = req.body;
	try {
		const body = req.body;
		if (!id || !mongoose.isValidObjectId(id)) {
			return res.status(404).json({ error: 'Enter a valid user' });
		}
		const allowedFields = ['name', 'email', 'phone', 'role'];
		const updateData = {};

		allowedFields.forEach((field) => {
			if (body[field] !== undefined) updateData[field] = body[field];
		});

		const updatedUser = await User.findByIdAndUpdate({ _id: id }, updateData, {
			new: true,
			runValidators: true,
		});

		if (!updatedUser) {
			res.status(404).json({ error: 'User not found' });
		}
		res.status(200).json({
			user: updatedUser,
			message: 'User profile updated successfully',
		});
	} catch (error) {
		res.status(404).json({ error: error.message });
	}
};

// // // update user Password
export const updatePassword = async (req, res) => {
	const { oldPassword, newPassword } = req.body;
	try {
		if (!req.user._id) {
			return res.status(401).json({ error: 'User not found' });
		}
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		// console.log('oldPassword:',oldPassword)
		const match = await bcrypt.compare(oldPassword, user.password);
		if (!match) {
			return res.status(401).json({ message: 'Invalid old password.' });
		}
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(newPassword, salt);

		let newUser = await User.findByIdAndUpdate(
			{ _id: user._id },
			{ password: hash },
			{ new: true },
		);
		res
			.status(200)
			.json({ user: newUser, message: 'Password Changed Successfully' });
	} catch (error) {
		console.error(error);
		res.status(404).json({ error: error.message });
	}
};
// // // update user Password
export const adminUpdatePassword = async (req, res) => {
	const { newPassword, userId } = req.body;
	try {
		if (!req.user._id) {
			return res.status(401).json({ error: 'User not found' });
		}
		if (req.user?.role !== 'admin') {
			return res.status(403).json({ error: 'Access denied' });
		}
		if (!userId || !mongoose.isValidObjectId(userId)) {
			return res.status(401).json({ error: 'Invalid user account' });
		}
		if (!newPassword) {
			return res.status(401).json({ error: 'New password is required' });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: 'User account  not found' });
		}
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(newPassword, salt);

		let newUser = await User.findByIdAndUpdate(
			{ _id: user._id },
			{ password: hash },
			{ new: true },
		);
		res
			.status(200)
			.json({ user: newUser, message: 'Password Changed Successfully' });
	} catch (error) {
		console.error(error);
		res.status(404).json({ error: error.message });
	}
};
// // // forget Password
export const forgetPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const user = await User.checkMail(email);
		// create a token
		const token = createToken(user._id, '10m');
		const link = `${process.env.FrountEnd_URL}/reset-password/${token}`;

		const mailoption = {
			from: 'ammuftau74@gmail.com', // sender address
			to: email, // receivers address
			subject: 'Email for Password Reset', // Subject line
			text: `This Link is valid for 10 Minutes ${link}`, // plain text body
			html: `<p>This Link is valid for 10 Minutes ${link}</p>`,
		};
		nodemailer
			.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASSWORD,
				},
			})
			.sendMail(mailoption, (error, info) => {
				if (error) {
					// console.log(error, 'error');
					res.status(401).json({ error: error });
				} else {
					// console.log(info.response, 'success');
					res.status(200).json({
						token,
						info,
						message: 'Password reset link sent successfully',
					});
				}
			});
	} catch (error) {
		console.log(error);
		res.status(404).json({ error: error });
	}
};

// // // reset Password
export const resetPassword = async (req, res) => {
	const { token } = req.params;
	try {
		// let user = await User.find({ _id: id });

		// if (!user) {
		// 	res.status(404).json({ error: 'Invald verification link!');
		// }
		// // verify the token
		const verify = jwt.verify(token, process.env.SECRET);

		if (!verify) {
			res.status(404).json({ error: 'verification failed' });
		}
		res
			.status(200)
			.json({ verify, token, message: 'Password Reset Successfully' });
	} catch (error) {
		res.status(401).json({ error: error, message: 'Something went wrong' });
	}
};

// // // change Password
export const changePassword = async (req, res) => {
	const { token, password, confirmPassword } = req.body;
	try {
		// // verify the token
		const verify = jwt.verify(token, process.env.SECRET);
		if (!verify) {
			return res.status(401).json({ message: 'verification failed!' });
		}
		if (verify) {
			const newpassword = await User.changepsw(
				{ _id: verify._id },
				password,
				confirmPassword,
			);

			let user = await User.findByIdAndUpdate(
				{ _id: verify._id },
				{ password: newpassword },
				{ new: true },
			);
			if (!user) {
				return res.status(401).json({ message: 'something went wrong!' });
			}
			res.status(200).json({ message: 'Password Changed Successfully' });
		} else {
			res.status(401).json({ status: 401, message: 'user not exist' });
		}
	} catch (error) {
		res.status(404).json({ error: error.message });
	}
};

// // // delete user
export const deleteUser = async (req, res) => {
	const { id, token } = req.body;
	try {
		// // verify the token
		const verify = jwt.verify(token, process.env.SECRET);
		if (!verify) {
			return res.status(401).json({ error: 'verification failed' });
		}
		if (verify) {
			let user = await User.findByIdAndDelete({ _id: id });
			// let wallet = await Wallet.findByIdAndDelete({ userId: user._id });
			// let transaction = await Transaction.findByIdAndDelete({
			// 	userId: user._id,
			// });

			user = await user.save();
			res.status(200).json({ message: 'Account Deleted Successfully' });
		} else {
			res.status(401).json({ status: 401, message: 'user not exist' });
		}
	} catch (error) {
		res.status(404).json({ error: error.message });
	}
};
