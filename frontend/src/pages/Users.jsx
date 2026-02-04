import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useState } from 'react';
import EditUserModal from '../components/modals/EditUserModal.jsx';
import AddUserModal from '../components/modals/AddUserModal.jsx';
import EditUserPasswordModal from '../components/modals/EditUserPasswordModal.jsx';
// import OpeningBalance from '../components/modals/CompanyOpeningBalance.jsx';
// import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { Edit3Icon, Lock, Plus } from 'lucide-react';
const Users = () => {
	const [loading, setIsLoading] = useState(false);
	const [isAddModal, setIsAddModal] = useState(false);
	const [isEditModal, setIsEditModal] = useState(false);
	const [isEditPassModal, setIsEditPassModal] = useState(false);
	const [customer, setCustomer] = useState(null);
	const { user } = useContext(AuthContext);
	const { data, isLoading, error } = useQuery({
		queryKey: ['users'],
		queryFn: async () => fetchUsers(user),
	});
	useEffect(() => {
		// if (data && data.length > 0) {
		if (data) {
			// setBusiness(data);
			console.log(data);
			// navigate('/');
		}
		if (error) {
			console.log(error);
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);

	const handelEdit = async (data) => {
		console.log('Edit data', data);
		setCustomer(data);
		setIsEditModal(true);
	};
	const handelEditPassword = async (data) => {
		console.log('Edit data', data);
		setCustomer(data);
		setIsEditPassModal(true);
	};

	return (
		<>
			<main className="  w-full py-3 pl-7 pr-5 gap-5 flex flex-col space-y-3">
				<div className="flex justify-between">
					<h4 className="font-semibold text-lg text-primary">Users</h4>
					<button onClick={() => setIsAddModal(true)}>
						<Plus />
					</button>
				</div>
				<div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
					<table className="min-w-full divide-y divide-gray-200 bg-white">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
									Avatar
								</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
									Name
								</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
									Email
								</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
									Role
								</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
									Created
								</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
									Updated
								</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
									Action
								</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-gray-100">
							{data?.length > 0 &&
								data?.map((user) => (
									<tr key={user._id} className="hover:bg-gray-50">
										<td className="px-4 py-3">
											<img
												src={
													user.coverImage?.url ||
													'/assets/admin/dashboard/user1.svg'
												}
												alt={user.name}
												className="h-10 w-10 rounded-full object-cover border"
											/>
										</td>
										<td className="px-4 py-3 font-medium text-gray-900">
											{user.name}
										</td>
										<td className="px-4 py-3 text-gray-600">{user.email}</td>
										<td className="px-4 py-3">
											<span
												className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold
                    ${
											user.role === 'admin'
												? 'bg-red-100 text-red-700'
												: 'bg-blue-100 text-blue-700'
										}`}
											>
												{user.role}
											</span>
										</td>
										<td className="px-4 py-3 text-sm text-gray-500">
											{new Date(user.createdAt).toLocaleDateString()}
										</td>
										<td className="px-4 py-3 text-sm text-gray-500">
											{new Date(user.updatedAt).toLocaleDateString()}
										</td>
										<td className="px-4 py-3 text-sm text-gray-500 flex gap-3">
											<button
												onClick={() => handelEdit(user)}
												className="text-blue-500 hover:text-blue-700"
											>
												<Edit3Icon className="size-4" />
											</button>
											<button onClick={() => handelEditPassword(user)}>
												<Lock className="size-4" />
											</button>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</main>
			<AddUserModal
				show={isAddModal}
				setShow={setIsAddModal}
				setLoading={setIsLoading}
				loading={isLoading}
			/>
			<EditUserModal
				show={isEditModal}
				setShow={setIsEditModal}
				setLoading={setIsLoading}
				loading={isLoading}
				customer={customer}
			/>
			<EditUserPasswordModal
				show={isEditPassModal}
				setShow={setIsEditPassModal}
				setLoading={setIsLoading}
				loading={isLoading}
				customer={customer}
			/>
			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default Users;
