import { Link } from 'react-router-dom';
import hero from '../assets/young.jpg';
import Image1 from '../assets/metal.jpeg';
import Image2 from '../assets/metals.jpg';
import Image3 from '../assets/metall.webp';
import { motion } from 'framer-motion';
const Hero = () => {
	const data = [
		{
			title: 'Alternative power',
			subTitle: 'Always stay in power',
			image: Image1,
			description:
				'Durable and cost effective alternative to solar power your home, offices and business.',
			link: '',
		},
		{
			title: 'Appliances',
			subTitle: 'Improving your live',
			image: Image2,
			description:
				'Stay connected with high tech appliancies to make your live easy.',
			link: '',
		},
		{
			title: 'Consultancy',
			subTitle: 'Ask us about It',
			image: Image3,
			description:
				'Let us find solution together, consult us about your need and experiences.',
			link: '',
		},
	];

	return (
		<div className="bg-white">
			<header className="absolute inset-x-0 top-0 z-50">
				<nav
					className="flex items-center justify-between p-6 lg:px-8"
					aria-label="Global"
				>
					<div className="flex lg:flex-1">
						<a href="#" className="-m-1.5 p-1.5">
							<span className="sr-only">Salisu Kano</span>
							<img className="h-8 w-auto" src="./logo.jpg" alt="" />
							{/* <span className="md:ml-2 text-sm md:text-lg font-semibold tracking-wide  uppercase">
								
							</span> */}
						</a>
					</div>
					<div className="lg:flex lg:flex-1 lg:justify-end">
						<Link
							to="/login"
							className="rounded-md bg-green-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
						>
							Log in <span aria-hidden="true">&rarr;</span>
						</Link>
					</div>
				</nav>
			</header>

			<div className="relative isolate px-6 pt-14 lg:px-8">
				<div
					className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
					aria-hidden="true"
				>
					<div
						className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-green-100 to-green-100 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
						//   style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
					></div>
				</div>
				<div className="text-gray-900 pt-12 pr-0 pb-14 pl-0 ">
					<div
						className="w-full pt-4 px-5 pb-6 mt-0 mr-auto mb-0 ml-auto space-y-5 sm:py-8 md:py-12 sm:space-y-8 md:space-y-16
      max-w-7xl"
					>
						<div className="flex flex-col items-center sm:px-5 md:flex-row ">
							<div className="flex flex-col items-start justify-center w-full h-full pt-6 pr-0 pb-6 pl-0 mb-6 md:mb-0 md:w-1/2">
								<div
									className="flex flex-col items-start justify-center h-full space-y-3 transform md:pr-10 lg:pr-16
            md:space-y-5"
								>
									<h1 className="text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
										Salisu <span className="text-gray-900"> Kano </span>
										<span className="text-green-900">
											International Limited{' '}
										</span>
									</h1>
									<div className="pt-2 pr-0 pb-0 pl-0">
										<motion.p
											initial={{ opacity: 0, y: 50 }}
											whileInView={{
												opacity: 1,
												y: 0,
												transition: { delay: 0.4, duration: 0.5 },
											}}
											viewport={{ once: false, amount: 0.5 }}
											className="text-pretty text-lg md:text-2xl font-medium text-gray-500 sm:text-xl/8"
										>
											Stay ahead of your competitors with our cutting-edge
											technology solutions.
										</motion.p>
									</div>
								</div>
							</div>
							<motion.div
								whileInView={{
									opacity: 1,
									// y: 0,
									scale: 1,
									transition: { delay: 0.4, duration: 0.5 },
								}}
								viewport={{ once: false, amount: 0.5 }}
								initial={{ visible: { opacity: 0, scale: 0 } }}
								animate="visible"
								className="w-full md:w-1/2 h-full"
							>
								<div className="block">
									<img
										src={hero}
										className="object-cover rounded-lg max-h-64 sm:max-h-96 btn- w-full h-full md:min-h-[420px]"
									/>
								</div>
							</motion.div>
						</div>
						<section className="py-20 ">
							<div className="text-2xl font-semibold md:mb-6 py-4 text-center">
								<h2 className="text-balance text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
									Our Services
								</h2>
								<p className="mt-1 mb-3 text-lg md:text-xl text-green-900">
									One stop solution for technologies
								</p>
							</div>
							<div className="grid grid-cols-12 sm:px-5 gap-x-8 gap-y-16">
								{data.map((item, index) => (
									<div
										key={index}
										className="flex flex-col items-start col-span-12 space-y-3 sm:col-span-6 xl:col-span-4 rounded-md hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg pb-3 cursor-pointer "
									>
										<img
											src={item.image}
											className="object-cover w-full mb-2 overflow-hidden rounded-lg shadow-sm max-h-56 btn-"
										/>
										<div className="w-full px-2 md:px-3 py-3">
											<motion.p
												initial={{ opacity: 0, y: 50 }}
												whileInView={{
													opacity: 1,
													y: 0,
													transition: { delay: 0.4, duration: 0.5 },
												}}
												viewport={{ once: false, amount: 0.5 }}
												className="w-fit bg-green-500 md:flex items-center leading-none text-sm my-2 font-medium text-gray-50 py-2 px-3
											rounded-full uppercase inline-block"
											>
												{item.title}
											</motion.p>
											<h2 className="text-lg font-bold sm:text-xl md:text-2xl">
												{item.subTitle}
											</h2>
											<p className="text-sm text-black">{item.description}</p>
										</div>
									</div>
								))}
							</div>
						</section>
					</div>
				</div>
				<div
					className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
					aria-hidden="true"
				>
					<div
						className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-green-50 to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
						//   style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
					></div>
				</div>
			</div>
		</div>
	);
};

export default Hero;
