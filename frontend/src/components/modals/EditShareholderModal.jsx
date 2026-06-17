/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const EditShareholderModal = ({ show, setShow, shareholder }) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();

	// Form state
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');

	// Sync form with shareholder when modal opens or shareholder changes
	useEffect(() => {
		if (shareholder && show) {
			setEmail(shareholder.email || '');
			setName(shareholder.name || '');
			setAddress(shareholder.address || '');
			setPhone(shareholder.phone || '');
		}
	}, [shareholder, show]);

	const apiUrl = import.meta.env.VITE_API_URL;

	const mutation = useMutation({
		mutationFn: (updatedshareholder) =>
			axios.patch(
				`${apiUrl}/shareholders/${shareholder._id}`,
				updatedshareholder,
				{
					headers: { Authorization: `Bearer ${user?.token}` },
				},
			),
		onSuccess: () => {
			queryClient.invalidateQueries(['shareholders']);
			queryClient.invalidateQueries(['shareholders', shareholder._id]);
			queryClient.invalidateQueries({
				queryKey: ['shareholders', 'dashboard'],
			});
			toast.success('shareholder updated successfully');
			setShow(false); // close modal
		},
		onError: (error) => {
			toast.error(getError(error));
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!name.trim()) {
			return toast.error('Name is required');
		}

		mutation.mutate({
			email: email.trim(),
			phone: phone.trim(),
			address: address.trim(),
			name: name.trim(),
		});
	};

	const isSubmitting = mutation.isPending;

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[450px] max-w-2xl">
				<div className="space-y-2 p-4">
					{/* Header */}
					<div className="flex justify-between items-start">
						<h2 className="font-semibold text-lg text-blue-500">
							Update shareholder
						</h2>
						<button
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="m-1 p-1 shadow rounded-full bg-red-200 hover:bg-red-300 transition-colors disabled:opacity-50"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					<form onSubmit={handleSubmit}>
						<div className="p-2">
							<div className="md:flex gap-2">
								<div className="mb-2 flex-1">
									<label className="text-base text-black">
										Name <span className="text-red-600">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
								<div className="mb-2 flex-1">
									<label className="text-base text-black">
										Phone <span className="text-red-600">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="text"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
							</div>
							<div className="md:flex gap-2">
								<div className="mb-2 flex-1">
									<label className="text-base text-black">
										Email <span className="text-red-600">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
								<div className="mb-2 flex-1">
									<label className="text-base text-black">
										Address <span className="text-red-600">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="address"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
							</div>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<span className="inline-flex items-center">
									<svg
										className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
										/>
									</svg>
									Updating...
								</span>
							) : (
								'Update shareholder'
							)}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default EditShareholderModal;
