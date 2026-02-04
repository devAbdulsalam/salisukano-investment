import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// import validator from 'validator';
const UserSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			min: 2,
			max: 100,
		},
		email: {
			type: String,
			required: true,
			max: 50,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			min: 5,
		},
		phone: {
			type: String,
			min: 8,
		},
		image: {
			public_id: {
				type: String,
			},
			url: {
				type: String,
			},
		},
		coverImage: {
			public_id: {
				type: String,
			},
			url: {
				type: String,
				default: `https://via.placeholder.com/200x200.png`,
			},
		},
		role: {
			type: String,
			enum: ['user', 'admin', 'superAdmin', 'finance', 'secretary'],
			default: 'admin',
		},
	},
	{ timestamps: true }
);

// static signup method
UserSchema.statics.signup = async function (name, email, password) {
	// //Validator for strong password
	// if(!validator.isStrongPassword(password)){
	//     throw Error('Input a strong password')
	// }
	if (!(password.length > 4)) {
		throw new Error('Input a strong password');
	}

	const user = await this.create({ name, email, password: hash });
	return user;
};

// static login method
UserSchema.statics.login = async function (email, password) {
	if (!email && !password) {
		throw Error('All fields must be filled');
	}

	let user = await this.findOne({ email });

	if (!user) {
		throw Error('email or password is incorrect!!');
	}

	const match = bcrypt.compare(password, user.password);
	if (!match) {
		throw Error('email or password is incorrect!');
	}

	return user;
};

// static checkMail method
UserSchema.statics.checkMail = async function (email) {
	if (!email) {
		throw Error('Email is required');
	}

	let user = await this.findOne({ email });

	if (!user) {
		throw Error('User does not  found!');
	}

	return user;
};

// //change password
UserSchema.statics.changepsw = async function (_id, password, confirmPassword) {
	let user = await this.findOne({ _id });

	if (!user) {
		throw Error('User does not  exist!!');
	}
	if (password !== confirmPassword) {
		throw Error('passwords does not  match!!');
	}

	// if (
	// 	!validator.isStrongPassword(password, {
	// 		minLength: 6,
	// 		minLowercase: 1,
	// 		minUppercase: 1,
	// 		// minNumbers: 1,
	// 		// minSymbols: 1,
	// 	})
	// ) {
	// 	throw Error('Input a strong password');
	// }

	const salt = await bcrypt.genSalt(10);
	const hash = await bcrypt.hash(password, salt);

	return hash;
};

// module.exports = mongoose.model('User', userSchema);

const User = mongoose.model('User', UserSchema);
export default User;
