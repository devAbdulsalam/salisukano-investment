import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

export const fetchSite = async () => {
	try {
		const { data } = await axios.get(`${apiUrl}/general`);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchDashboard = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/general/dashboard`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchRegisteredWaybills = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/waybill-registers`, config);
		console.log('waybill-registers', data);
		return data.data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchRegisteredWaybill = async (id, user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/waybill-registers/${id}`,
			config,
		);
		return data?.data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchWaybills = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/waybills`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchWaybill = async (id, user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/waybills/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchUsers = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/users`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchBusiness = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/business`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchBusinessById = async (prop) => {
	const { token, id } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/business/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchSummary = async (prop) => {
	const { token, parent } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/${parent}/summary`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchDetailSummary = async (prop) => {
	const { token, id, parent } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/${parent}/${id}/summary`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchAssets = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/assets`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchAsset = async (prop) => {
	const { token, id } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/assets/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchSupply = async (prop) => {
	const { token, id } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/supplies/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchSuppliers = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/supplies/${prop.id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchAccounts = async (props) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${props?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/accounts/${props.id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchAccount = async (props) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${props.user?.token}`,
			},
		};
		console.log(props);
		const { data } = await axios.get(`${apiUrl}/accounts/${props.id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchProducts = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/products`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchProduct = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/products/${prop.id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchOrders = async (user) => {
	// console.log(user);
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/management/orders`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchOrder = async (prop) => {
	const { token, id } = prop;
	console.log(prop);
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/orders/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};

export const fetchCoupons = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/coupons`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCoupon = async (prop) => {
	const { token, id } = prop;
	// console.log(prop);
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/coupons/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCustomers = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/customers`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchDebtor = async (prop) => {
	const { token, id } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/debtors/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchDebtors = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/debtors`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCredit = async (prop) => {
	const { token, creditId } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/creditors/${creditId}/credit`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCreditor = async (prop) => {
	const { token, id } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/creditors/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCreditorMonthlyCredit = async (prop) => {
	const { token, id } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/creditors/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};

export const fetchCompanyMonthlyCredits = async (prop) => {
	const { token, id, companyId, month } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/creditors/${id}/month/${month}/company/${companyId}`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCreditorMonthlyCredits = async (prop) => {
	const { token, id, month } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/creditors/${id}/month/${month}`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCreditors = async (user) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/creditors`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCustomer = async (prop) => {
	const { token, id } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/customers/${id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCustomerReport = async (prop) => {
	const { user } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/customers/${prop.id}/report`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCustomerPayments = async (prop) => {
	const { user } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/payments/${prop.id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchProductCategory = async (prop) => {
	const { user } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/products/category`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchProductCategoryDetail = async (prop) => {
	const { token, id } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/products/category/${id}`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};

export const fetchProductCategoryAndSubCategory = async (prop) => {
	const { user } = prop;
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${user?.token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/products/category/sub-category`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchTransactions = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/transactions`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchTransaction = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/transactions/${prop.id}`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchCurrentAccount = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};
		console.log(prop);
		const { data } = await axios.get(
			`${apiUrl}/accounts/active/${prop.id}`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchAccountCommmission = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};

		const { data } = await axios.get(
			`${apiUrl}/accounts/commission/${prop.id}`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchPrices = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/prices/${prop.id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchPayments = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};
		const { data } = await axios.get(`${apiUrl}/payments/${prop.id}`, config);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
export const fetchTransactingCustomers = async (prop) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${prop?.token}`,
			},
		};
		const { data } = await axios.get(
			`${apiUrl}/customers/transacting-customers`,
			config,
		);
		return data;
	} catch (error) {
		console.log(error.message);
		return error;
	}
};
