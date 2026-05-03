// import { useState } from 'react';
import { Link } from 'react-router-dom';
import Image1 from '../assets/metal.jpeg';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';

const Left = () => {
	// const [showMenu, setShowMenu] = useState(false);
	const bgImage = {
		backgroundImage: `linear-gradient(to right, rgba(1, 22, 8, 0.5), rgba(2, 46, 65, 0.5)), url(${Image1})`,
		backgroundSize: 'cover',
		backgroundPosition: 'center',
	};
	return (
		<>
			<div
				className="w-4/12 bg-cover bg-no-repeat hidden md:flex flex-col relative h-full overflow-y-hidden bg-gradient-to-r from-green-400 to-blue-500 justify-center"
				style={bgImage}
			>
				<div className="pt-6 pl-4 p-4 pb-2  z-30 flex justify-between items-center absolute top-0 w-full ">
					<Link to="/" className="flex ">
						<img className="w-10 h-10 rounded-sm" src="./logo.jpg" alt="logo" />
					</Link>
				</div>
				<div className="px-4 ">
					<motion.h1
						initial={{ opacity: 0, y: 50 }}
						whileInView={{
							opacity: 1,
							y: 0,
							transition: { delay: 0.2, duration: 0.5 },
						}}
						viewport={{ once: false, amount: 0.5 }}
						className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl"
					>
						Salisu <span className="text-[#BBF7D0]"> Kano </span>
						<span className="text-white">International Limited </span>
					</motion.h1>
					<div className="p-2 anitext">
						<p className=" text-xl text-wrap text-white mt-4">
							<TypeAnimation
								sequence={[
									// Same substring at the start will only be typed out once, initially
									'Stay ahead of the game',
									1000, // wait 1s before replacing "Mice" with "Hamsters"
									'with our seamless low cost',
									1000, // wait 1s before replacing "Mice" with "Hamsters"
									'Quality and',
									1000,
									'Durable technologies',
									1000,
								]}
								wrapper="span"
								speed={200}
								deletionSpeed={200}
								style={{ fontSize: '2em', display: 'inline-block' }}
								repeat={Infinity}
							/>
						</p>
					</div>
				</div>
				<div className="text-center absolute bottom-2 w-full flex flex-wrap justify-between px-2">
					<a
						className=" whitespace-nowrap text-white hover:text-secondary-light"
						href="#"
					>
						© Salisu 2024
					</a>
					<a
						className=" whitespace-nowrap text-tertiary hover:text-secondary-light"
						href="#"
					>
						{' '}
					</a>
				</div>
			</div>
		</>
	);
};

export default Left;
