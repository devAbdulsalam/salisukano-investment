/* eslint-disable react/prop-types */
// import { useState } from 'react';
import { useContext, useEffect } from 'react';
import Cards from '../components/DashboardCard';
import Charts from '../components/Charts';
import RecentTransactions from '../components/RecentTransactions.jsx';
// import { cardData, orderTableData } from '../data.js';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../hooks/axiosApis';
import Loader from '../components/Loader.jsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../context/authContext.jsx';
const Dashboard = ({ openSideBar }) => {
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();
	const { data, isLoading, error } = useQuery({
		queryKey: ['dashboard'],
		queryFn: async () => fetchDashboard(user),
	});
	useEffect(() => {
		if (data) {
			console.log(data);
			// console.log(data?.recentOrders);
			// navigate('/');/
		}
		if (error) {
			console.log(error);
			toast.error(error?.message);
		}
	}, [data, error]);
	const handelAddModal = () => {
		navigate('/companies');
	};
	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 grid xl:grid-cols-12 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5 justify-start md:justify-center">
				<Cards openSideBar={openSideBar} data={data} />
				<Charts data={data} />
				<RecentTransactions
					orderTableData={data?.transactions}
					handelAddModal={handelAddModal}
				/>
			</main>
			{isLoading && <Loader />}
		</>
	);
};

export default Dashboard;
