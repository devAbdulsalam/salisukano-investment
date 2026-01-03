import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LocalStorage } from '../hooks/LocalStorage';
import getError from '../hooks/getError';
import Left from '../components/Left';
import { FiEye, FiEyeOff } from 'react-icons/fi';
// import logo from '../assets/download.jfif';
const Login = () => {
	const { user, setUser } = useContext(AuthContext);
	const apiUrl = import.meta.env.VITE_API_URL;
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	useEffect(() => {
		if (user) {
			navigate('/dashboard');
		}
	});
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email.trim() || !password.trim()) {
			return toast.error('Email and password  is required!');
		}
		try {
			setIsLoading(true);
			const data = { email, password };
			// console.log(data);
			axios
				.post(`${apiUrl}/users/login`, data)
				.then((res) => {
					if (res.data) {
						toast.success('Logged in successfully');
					}

					setUser({ ...res.data.user });
					LocalStorage.set('user', { ...res.data.user });
					if (rememberMe) {
						LocalStorage.set('rememberMe', 'true');
						LocalStorage.set('username', user);
					} else {
						LocalStorage.remove('rememberMe');
						LocalStorage.remove('username');
					}
				})
				.catch((error) => {
					console.log('error', error);
					const message = getError(error);
					toast.error(message);
				})
				.finally(() => {
					setIsLoading(false);
				});
		} catch (error) {
			const message = getError(error);
			toast.error(message);
			setIsLoading(false);
		}
	};
	return (
		<>
			<div className="flex h-screen w-full items-center justify-center">
				<Left />
				<div className="pattern bg-repeat w-full md:w-8/12 h-full md:overflow-hidden md:p-4 flex items-center justify-center">
					<div className=" rounded-xl bg-slate-200 bg-opacity-50 px-6 py-10 shadow-lg backdrop-blur-md max-sm:px-8 w-full mx-4 sm:w-[500px] md:mx-4">
						<div className="text-black">
							<div className="mb-8 flex flex-col items-center">
								<img
									src="./logo.jpg"
									className="mx-auto h-20 w-auto rounded-full"
									alt="Workflow"
								/>
								<h1 className="mb-2 text-lg font-semibold uppercase">
									Salisu Kano International Limited
								</h1>
							</div>
							<form onSubmit={handleSubmit} className="w-full">
								<div className="mb-4 text-lg">
									<p className="mb-0 text-base text-black">
										Email <span className="text-red-500">*</span>
									</p>
									<input
										className="rounded-lg border-none bg-slate-400 bg-opacity-50 px-4 w-full py-2 text-inherit placeholder-slate-800 shadow-lg outline-none backdrop-blur-md"
										type="text"
										name="name"
										placeholder="salisu@email.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>

								<div className="mb-4 text-lg relative">
									<p className="mb-0 text-base text-black">
										Password <span className="text-red-500">*</span>
									</p>
									<input
										className="rounded-lg border-none bg-slate-400 bg-opacity-50 px-4 w-full py-2  text-inherit placeholder-slate-800 shadow-lg outline-none backdrop-blur-md"
										type={showPassword ? 'text' : 'password'}
										name="password"
										placeholder="*********"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>
									<span className="absolute inset-y-0 right-2 flex items-center h-[40px] text-lg mt-6  px-2.5 z-10 bg-transparent">
										{showPassword ? (
											<FiEyeOff
												onClick={() => setShowPassword(false)}
												className="text-black cursor-pointer"
											/>
										) : (
											<FiEye
												onClick={() => setShowPassword(true)}
												className="text-black cursor-pointer"
											/>
										)}
									</span>
								</div>
								<div className="mt-6 flex items-center justify-between">
									<div className="flex items-center">
										<input
											id="remember_me"
											name="remember"
											type="checkbox"
											checked={rememberMe}
											onChange={() => setRememberMe(!rememberMe)}
											className="form-checkbox h-4 w-4 text-green-800 transition duration-150 ease-in-out"
										/>
										<label
											htmlFor="remember_me"
											className="ml-2 block text-sm leading-5 text-gray-900"
										>
											Remember me
										</label>
									</div>

									<div className="text-sm leading-5">
										<Link
											to="/forgot-password"
											className="font-medium text-green-800 hover:text-green-600 focus:outline-none focus:underline transition ease-in-out duration-150"
										>
											Forgot your password?
										</Link>
									</div>
								</div>
								<div className="mt-6 flex justify-center text-lg text-black">
									<button
										type="submit"
										className="rounded-lg bg-green-800 hover:bg-opacity-50 px-10 w-full py-2 text-white shadow-xl backdrop-blur-md transition-colors duration-300 "
									>
										Login
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{isLoading && <Loader />}
		</>
	);
};

export default Login;
