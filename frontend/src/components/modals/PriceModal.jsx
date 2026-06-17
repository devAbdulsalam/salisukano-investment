/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const PriceModal = ({
	show,
	setShow,
	setLoading,
	loading,
	priceData,
	customerId,
}) => {
	const { user } = useContext(AuthContext);
	const [newCast, setNewCast] = useState(0);
	const [oldCast, setOldCast] = useState(0);
	const [newSpecial, setNewSpecial] = useState(0);
	const [oldSpecial, setOldSpecial] = useState(0);
	const [newMix, setNewMix] = useState(0);
	const [oldMix, setOldMix] = useState(0);
	const [disableInput, setDisableInput] = useState(false);
	const apiUrl = import.meta.env.VITE_API_URL;

	useEffect(() => {
		setOldMix(priceData?.oldMix);
		setOldSpecial(priceData?.oldSpecial);
		setOldCast(priceData?.oldCast);
		setDisableInput(true);
	}, [priceData]);
	const config = {
		headers: {
			Authorization: `Bearer ${user?.token}`,
		},
	};
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!newCast) {
			return toast.error('New Cast Price is required');
		}
		if (!newMix) {
			return toast.error('New Mix Price is required');
		}
		if (!newSpecial) {
			return toast.error('New Special Price is required');
		}
		setLoading(true);
		setShow(false);
		try {
			axios
				.post(
					`${apiUrl}/prices/${customerId}`,
					{ newCast, oldCast, newSpecial, oldSpecial, newMix, oldMix },
					config
				)
				.then((res) => {
					if (res.data) {
						queryClient.invalidateQueries({
							queryKey: [
								'dashboard',
								'accounts',
								'customers',
								'pricing',
								'creditors',
							],
						});
						toast.success('Price updated successfully');
					}
					navigate(`/companies/${customerId}`);
				})
				.catch((error) => {
					const message = getError(error);
					toast.error(message);
				})
				.finally(() => {
					setNewCast(0);
					setNewMix(0);
					setNewSpecial(0);
					setLoading(false);
				});
		} catch (error) {
			console.log(error);
			setShow(true);
		}
	};

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[280px] md:min-w-[450px]">
				<div className="space-y-5 p-4">
					<div className="flex justify-between">
						<div>
							<p className="font-semibold text-lg text-primary">Add Price</p>
						</div>
						<button
							onClick={() => setShow(false)}
							className="m-1 p-1 py-1 shadow rounded-full bg-red-200 hover:bg-red-300 duration-150 ease-in-out"
						>
							<HiXMark className="fa-solid fa-xmark text-xl text-red-600 hover:text-red-800" />
						</button>
					</div>
					<div className="w-full px-2">
						<div className="md:grid grid-cols-2 gap-2 w-full">
							<div className="mb-5">
								<label className="mb-0 text-base text-black">
									Old Mix <span className="text-red-500">*</span>
								</label>
								<input
									className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
									type="number"
									value={oldMix}
									disabled={disableInput}
									readOnly={disableInput}
									onChange={(e) => setOldMix(e.target.value)}
								/>
							</div>
							<div className="mb-5">
								<label className="mb-0 text-base text-black">
									New Mix Price<span className="text-red-500">*</span>
								</label>
								<input
									className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
									type="number"
									value={newMix}
									onChange={(e) => setNewMix(e.target.value)}
								/>
							</div>
						</div>
						<div className="md:grid grid-cols-2 gap-2 w-full">
							<div className="mb-5">
								<label className="mb-0 text-base text-black">
									Old Cast <span className="text-red-500">*</span>
								</label>
								<input
									className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
									type="number"
									value={oldCast}
									disabled={disableInput}
									readOnly={disableInput}
									onChange={(e) => setOldCast(e.target.value)}
								/>
							</div>
							<div className="mb-5">
								<label className="mb-0 text-base text-black">
									New Cast Price<span className="text-red-500">*</span>
								</label>
								<input
									className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
									type="number"
									value={newCast}
									onChange={(e) => setNewCast(e.target.value)}
								/>
							</div>
						</div>
						<div className="md:grid grid-cols-2 gap-2 w-full">
							<div className="mb-2">
								<label className="mb-0 text-base text-black">
									Old Special <span className="text-red-500">*</span>
								</label>
								<input
									className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
									type="number"
									value={oldSpecial}
									disabled={disableInput}
									readOnly={disableInput}
									onChange={(e) => setOldSpecial(e.target.value)}
								/>
							</div>
							<div className="mb-2">
								<label className="mb-0 text-base text-black">
									New Special Price<span className="text-red-500">*</span>
								</label>
								<input
									className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
									type="number"
									value={newSpecial}
									onChange={(e) => setNewSpecial(e.target.value)}
								/>
							</div>
						</div>
					</div>
					<button
						disabled={loading}
						className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out"
						onClick={handleSubmit}
					>
						<span>Add Price</span>
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default PriceModal;
