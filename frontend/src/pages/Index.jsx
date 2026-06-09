import { Link, useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Grid from '../components/Grid';
import { motion } from 'framer-motion';
import { useContext, useEffect } from 'react';
import AuthContext from '../context/authContext';

const Index = () => {
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();
	useEffect(() => {
		if (user) {
			navigate('/dashboard');
		}
	});
	return (
		<>
			<Hero />
			<Grid />
			<section className="pattern bg-repeat text-gray-600 body-font relative ">
				<div className="lg:w-8/12 px-5 py-10 mx-auto flex sm:flex-nowrap flex-wrap">
					<div
						className="md:w-1/2 overflow-hidden sm:mr-10 flex justify-center relative"
						data-aos="fade-right"
						data-aos-easing="linear"
						data-aos-duration="1000"
					>
						<div>
							<div className="py-2 md:mt-10">
								<h2 className="text-gray-900 sm:text-5xl">Contact us</h2>
								<span className="bg-green-900 block h-1 mt-1 group-hover:text-green-500 w-16 transition duration-150"></span>
							</div>
							<div>
								<motion.h1
									initial={{ opacity: 0, y: 50 }}
									whileInView={{
										opacity: 1,
										y: 0,
										transition: { delay: 0.2, duration: 0.5 },
									}}
									viewport={{ once: false, amount: 0.5 }}
									className="text-3xl my-6 text-green-900"
								>
									Say Hello
								</motion.h1>
								<motion.p
									initial={{ opacity: 0, y: 50 }}
									whileInView={{
										opacity: 1,
										y: 0,
										transition: { delay: 0.4, duration: 0.5 },
									}}
									viewport={{ once: false, amount: 0.5 }}
									className="text-sm md:text-lg text-gray-800"
								>
									Have a question? Our FAQs page may give you your answer. We're
									available 24/7 via phone
								</motion.p>
							</div>
							<div className="mt-4 space-y-3">
								<h2 className="title-font font-semibold text-gray-900 tracking-widest text-lg mt-4">
									PHONE
								</h2>
								<p className="mt-1 text-gray-800 md:text-lg">
									Call: +234 802 3239 018 or +234 806 723 7273
								</p>
								<h2 className="title-font font-semibold text-gray-900 tracking-widest text-lg">
									EMAIL
								</h2>
								<a className="text-tertiary md:text-lg  leading-relaxed">
									support@salisukano.com
								</a>
							</div>
						</div>
					</div>
					<div
						className="md:w-1/2 bg-white flex flex-col md:ml-auto w-full p-10 mt-8 md:mt-0 rounded-lg"
						data-aos="fade-up"
						data-aos-easing="linear"
						data-aos-duration="1000"
					>
						<p className="leading-relaxed mb-4 text-gray-600">
							or you can fill in our contact form. we'll be in touch.
						</p>
						<div className="relative mb-2">
							<label htmlFor="name" className="leading-7 text-sm text-gray-600">
								Name
							</label>
							<input
								type="text"
								id="name"
								name="name"
								placeholder="Full Name"
								className="w-full bg-white rounded border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
							/>
						</div>
						<div className="relative mb-2">
							<label
								htmlFor="email"
								className="leading-7 text-sm text-gray-600"
							>
								Email Address
							</label>
							<input
								type="email"
								id="email"
								name="email"
								placeholder="abc@gmail.com"
								className="w-full bg-white rounded border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
							/>
						</div>
						<div className="relative mb-2">
							<label
								htmlFor="phone"
								className="leading-7 text-sm text-gray-600"
							>
								Phone Number
							</label>
							<input
								type="text"
								id="phone"
								name="phone"
								placeholder="09012345670"
								className="w-full bg-white rounded border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
							/>
						</div>
						<div className="relative mb-2">
							<label
								htmlFor="message"
								className="leading-7 text-sm text-gray-600"
							>
								Message
							</label>
							<textarea
								id="message"
								name="message"
								placeholder="Type in your message"
								className="w-full bg-white rounded border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 h-24 text-base outline-none text-gray-700 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"
							></textarea>
						</div>
						<button className="text-white bg-green-800 border-0 py-2 px-6 focus:outline-none hover:bg-green-900 rounded text-lg transition duration-200 ease-in-out">
							Button
						</button>
					</div>
				</div>
			</section>
			<footer className="bg-green-800 w-full p-4 ">
				<div
					id="contact"
					className="px-4 pt-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8"
				>
					{/* <div className="grid gap-10 mb-1 sm:grid-cols-2 lg:grid-cols-4"> */}
					<div className="sm:col-span-2 flex items-center justify-between my-1 space-x-3">
						<a
							href="/"
							aria-label="Go home"
							title="Company"
							className="inline-flex items-center"
						>
							<img
								src="./logo.jpg"
								className="mx-auto h-10 w-auto rounded-full"
								alt="Workflow"
							/>
							<span className="ml-2 text-xl font-bold tracking-wide text-white uppercase">
								Salisu Kano International Limited
							</span>
						</a>
						<div className="flex space-x-3">
							<a
								href="/"
								className="text-gray-50 hover:text-gray-200 transition-colors duration-300 hover:text-deep-purple-accent-400"
							>
								<svg viewBox="0 0 24 24" fill="currentColor" className="h-5">
									<path d="M24,4.6c-0.9,0.4-1.8,0.7-2.8,0.8c1-0.6,1.8-1.6,2.2-2.7c-1,0.6-2,1-3.1,1.2c-0.9-1-2.2-1.6-3.6-1.6 c-2.7,0-4.9,2.2-4.9,4.9c0,0.4,0,0.8,0.1,1.1C7.7,8.1,4.1,6.1,1.7,3.1C1.2,3.9,1,4.7,1,5.6c0,1.7,0.9,3.2,2.2,4.1 C2.4,9.7,1.6,9.5,1,9.1c0,0,0,0,0,0.1c0,2.4,1.7,4.4,3.9,4.8c-0.4,0.1-0.8,0.2-1.3,0.2c-0.3,0-0.6,0-0.9-0.1c0.6,2,2.4,3.4,4.6,3.4 c-1.7,1.3-3.8,2.1-6.1,2.1c-0.4,0-0.8,0-1.2-0.1c2.2,1.4,4.8,2.2,7.5,2.2c9.1,0,14-7.5,14-14c0-0.2,0-0.4,0-0.6 C22.5,6.4,23.3,5.5,24,4.6z"></path>
								</svg>
							</a>
							<a
								href="/"
								className="text-gray-50 hover:text-gray-200 transition-colors duration-300 hover:text-deep-purple-accent-400"
							>
								<svg viewBox="0 0 24 24" fill="currentColor" className="h-5">
									<path d="M22,0H2C0.895,0,0,0.895,0,2v20c0,1.105,0.895,2,2,2h11v-9h-3v-4h3V8.413c0-3.1,1.893-4.788,4.659-4.788 c1.325,0,2.463,0.099,2.795,0.143v3.24l-1.918,0.001c-1.504,0-1.795,0.715-1.795,1.763V11h4.44l-1,4h-3.44v9H22c1.105,0,2-0.895,2-2 V2C24,0.895,23.105,0,22,0z"></path>
								</svg>
							</a>
						</div>
						{/* </div> */}
					</div>
					<div className="flex flex-col justify-between pt-5 pb-10 border-t lg:flex-row">
						<div>
							<div className="hidden sm:col-span-2 text-tertiary space-x-5">
								<a
									className="text-sm font-semibold hover:text-secondary"
									href="./"
								>
									Home
								</a>
								<Link
									className="text-sm font-semibold hover:text-secondary"
									to="/login"
								>
									Log in
								</Link>
							</div>
							<p className="text-sm pt-2 text-white">
								© Copyright <span className="footer-date"></span>{' '}
								<span className="text-tertiary font-semibold">Salisu</span>. All
								rights reserved.
							</p>
						</div>
						<div>
							<p className="mt-4 text-sm text-white">
								{' '}
								Powered by:{' '}
								<a
									className="hover:text-secondary text-tertiary font-semibold"
									href="mailto:devabdulsalam74@gmail.com"
								>
									devAbdulsalam
								</a>
							</p>
						</div>
					</div>
				</div>
			</footer>
		</>
	);
};

export default Index;
