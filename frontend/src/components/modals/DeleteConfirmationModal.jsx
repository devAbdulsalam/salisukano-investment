/* eslint-disable react/prop-types */
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const DeleteConfirmationModal = ({
	show,
	setShow,
	onConfirm,
	isDeleting,
	itemName = 'this item',
}) => {
	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[380px] max-w-md">
				<div className="p-5">
					<div className="flex justify-between items-start mb-4">
						<h2 className="font-semibold text-lg text-red-600">
							Confirm Delete
						</h2>
						<button
							onClick={() => setShow(false)}
							disabled={isDeleting}
							className="p-1 shadow rounded-full bg-red-200 hover:bg-red-300 transition-colors disabled:opacity-50"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					<div className="mb-6">
						<p className="text-gray-700">
							Are you sure you want to delete{' '}
							<span className="font-semibold">{itemName}</span>? This action
							cannot be undone.
						</p>
					</div>

					<div className="flex gap-3 justify-end">
						<button
							onClick={() => setShow(false)}
							disabled={isDeleting}
							className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							onClick={onConfirm}
							disabled={isDeleting}
							className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center"
						>
							{isDeleting ? (
								<>
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
									Deleting...
								</>
							) : (
								'Delete'
							)}
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default DeleteConfirmationModal;
