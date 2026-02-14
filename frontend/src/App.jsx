import { Routes, Route } from 'react-router-dom';
import ProtectedRoutes from './hooks/ProtectedRoutes';
import NotFound from './NotFound';
import Login from './pages/Login';
// import Index from './pages/Index';
import ForgotPassword from './pages/ForgotPassword';
import DashboardLayout from './layouts/DashboardLayout';
import Transactions from './pages/Transactions';
import Dashboard from './pages/Dashboard';
import EditTransaction from './pages/EditTransaction';
import TransactionDetail from './pages/TransactionDetail';
import AddSupply from './pages/AddSupply';
import Payment from './pages/Payment';
import Payments from './pages/Payments';
import Supplies from './pages/Supplies';
import EditPayment from './pages/EditPayment';
import ChangePassword from './pages/ChangePassword';
import Settings from './pages/Settings';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import Customers from './pages/Customers';
import Pricing from './pages/Pricing';
import CustomerAddPayment from './pages/CustomerPayment';
import CustomerAddSupply from './pages/CustomerSupply';
import Loader from './components/Loader';
import { useState, useEffect } from 'react';
import Debtors from './pages/Debtors';
import Debtor from './pages/Debtor';
import DebtorReceipt from './pages/DebtorReceipt';
import Creditors from './pages/Creditors';
import MonthlyCredits from './pages/MonthlyCredits';
import Creditor from './pages/Creditor';
import NewCredit from './pages/NewCredit';
import CreditDetails from './pages/CreditDetails';
import Commission from './pages/Commission';
import EditCredit from './pages/EditCredit';
import Invoices from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';
import EditInvoice from './pages/EditInvoice';
import Users from './pages/Users';
import CompanyCredits from './pages/CompanyCredits';
// import Receiptt from './pages/Receipt';
import Register from './pages/InvoiceRegister';
import RegisterdInvoices from './pages/RegisterdInvoices';
function App() {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setTimeout(() => setLoading(false), 1000);
	}, []);

	return loading ? (
		<Loader />
	) : (
		<>
			<Routes>
				<Route path="/">
					{/* <Route path="/" element={<Index />} /> */}
					<Route path="/login" element={<Login />} />
					<Route path="/forgot-password" element={<ForgotPassword />} />
					<Route path="/forgot-password" element={<ForgotPassword />} />
					<Route path="/reset-password/:token" element={<ChangePassword />} />
					<Route element={<ProtectedRoutes />}>
						<Route exact path="/" element={<DashboardLayout />}>
							<Route path="/dashboard" element={<Dashboard />} />
							<Route path="/companies" element={<Customers />} />
							<Route path="/invoices" element={<Invoices />} />
							<Route path="/new-invoice" element={<NewInvoice />} />
							<Route path="/edit-invoice/:id" element={<EditInvoice />} />
							<Route
								path="/companies/payment/:customerId"
								element={<CustomerAddPayment />}
							/>
							<Route
								path="/companies/supply/:customerId"
								element={<CustomerAddSupply />}
							/>
							<Route path="/companies/:id" element={<Accounts />} />
							{/* <Route path="/accounts" element={< />} /> */}
							<Route path="/accounts/:id" element={<AccountDetail />} />
							<Route path="/transactions" element={<Transactions />} />
							<Route path="/add-supply/:id" element={<AddSupply />} />
							<Route path="/commission/:id" element={<Commission />} />
							<Route path="/payment/new/:id" element={<Payment />} />
							<Route path="/payment/edit/:id" element={<EditPayment />} />
							<Route
								path="/transactions/edit/:id"
								element={<EditTransaction />}
							/>
							<Route path="/transactions/:id" element={<TransactionDetail />} />
							<Route path="/supplies/:id" element={<Supplies />} />
							<Route path="/payments/:id" element={<Payments />} />
							<Route path="/pricing/:id" element={<Pricing />} />
							<Route path="/debtors" element={<Debtors />} />
							<Route path="/debtors/:id" element={<Debtor />} />
							<Route path="/debtors/:id/print" element={<DebtorReceipt />} />
							<Route path="/creditors" element={<Creditors />} />
							<Route path="/creditors/:id" element={<Creditor />} />
							<Route
								path="/creditors/:id/months/:month"
								element={<MonthlyCredits />}
							/>
							<Route
								path="/creditors/:id/months/:month/:companyId"
								element={<CompanyCredits />}
							/>
							<Route path="/creditors/:id/new-credit" element={<NewCredit />} />
							<Route
								path="/creditors/:id/credit/:creditId"
								element={<CreditDetails />}
							/>
							<Route
								path="/creditors/:id/edit/:creditId"
								element={<EditCredit />}
							/>
							<Route path="/settings" element={<Settings />} />
							<Route path="/users" element={<Users />} />
							<Route path="/register-invoices" element={<Register />} />
							<Route
								path="/registered-invoices"
								element={<RegisterdInvoices />}
							/>
							<Route
								path="/register-invoices/:id"
								element={<Register />}
							/>
						</Route>
					</Route>
				</Route>
				<Route path="/*" element={<NotFound />} />
			</Routes>
		</>
	);
}

export default App;
