import CustomerTable from '../components/CustomerTable.jsx';
import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useState } from 'react';
import AddCustomerModal from '../components/modals/AddCustomerModal.jsx';
import EditModal from '../components/modals/EditCustomer.jsx';
// import OpeningBalance from '../components/modals/CompanyOpeningBalance.jsx';
// import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchCustomers } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
const Company = () => {
	const [loading, setIsLoading] = useState(false);
	const [isAddModal, setIsAddModal] = useState(false);
	const [isEditModal, setIsEditModal] = useState(false);
	const [customer, setCustomer] = useState(null);
	const { user } = useContext(AuthContext);
	const { data, isLoading, error } = useQuery({
		queryKey: ['customers'],
		queryFn: async () => fetchCustomers(user),
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
	const handelAddModal = () => {
		setIsAddModal(true);
	};

	const handelEdit = async (data) => {
		console.log('Edit data', data);
		setCustomer(data);
		setIsEditModal(true);
	};

	return (
		<>
			<main className="  w-full py-3 pl-7 pr-5 gap-5 flex flex-col space-y-3">
				<div className="flex justify-between">
					<h4 className="font-semibold text-lg text-primary">Companies</h4>
				</div>
				<CustomerTable
					tableData={data || []}
					handelAddModal={handelAddModal}
					handelEdit={handelEdit}
				/>
			</main>
			<AddCustomerModal
				show={isAddModal}
				setShow={setIsAddModal}
				setLoading={setIsLoading}
				loading={isLoading}
			/>
			<EditModal
				show={isEditModal}
				setShow={setIsEditModal}
				setLoading={setIsLoading}
				loading={isLoading}
				customer={customer}
			/>
			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default Company;
