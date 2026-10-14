import React, { useState, useEffect } from 'react'; // Add this import at the top
import { Link } from 'react-router-dom';
import { Edit, Download, FileText, Calendar, Truck } from 'lucide-react';
import { invoiceAPI } from '../pages/api.js';
import toast from 'react-hot-toast';
import { formatDateWat } from '../utils/watDate';

const InvoiceList = () => {
	const [invoices, setInvoices] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchInvoices();
	}, []);

	const fetchInvoices = async () => {
		try {
			const response = await invoiceAPI.getInvoices();
			setInvoices(response.data.data);
		} catch (error) {
			toast.error('Failed to fetch invoices');
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadPDF = async (id) => {
		try {
			const response = await invoiceAPI.downloadPDF(id);
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `invoice_${id}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			toast.success('PDF downloaded successfully!');
		} catch (error) {
			toast.error('Failed to download PDF');
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-lg overflow-hidden">
			<div className="px-6 py-4 border-b border-gray-200">
				<div className="flex items-center">
					<FileText className="w-4 h-4 text-blue-600 mr-2" />
					<h2 className="text-lg font-bold text-gray-800">All Invoice</h2>
					<span className="ml-4 bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
						{invoices.length} invoices
					</span>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Date
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Customer
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Vehicle
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Total
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Balance
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{invoices.map((invoice) => (
							<tr key={invoice._id} className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="flex items-center">
										<Calendar className="w-4 h-4 text-gray-400 mr-2" />
										<span className="text-sm text-gray-900">
											{formatDateWat(invoice.date, 'PP')}
										</span>
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm font-medium text-gray-900">
										{invoice.customerName}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="flex items-center">
										<Truck className="w-4 h-4 text-gray-400 mr-2" />
										<span className="text-sm text-gray-900">
											{invoice.vehicleNumber}
										</span>
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">
										N{invoice.total.toLocaleString()}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm font-semibold text-green-600">
										N{invoice.balance.toLocaleString()}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div className="flex space-x-2">
										<Link
											to={`/edit-invoice/${invoice._id}`}
											className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
										>
											<Edit className="w-4 h-4 mr-1" />
											Edit
										</Link>
										<button
											onClick={() => handleDownloadPDF(invoice._id)}
											className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
										>
											<Download className="w-4 h-4 mr-1" />
											PDF
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{invoices.length === 0 && (
				<div className="text-center py-12">
					<FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						No invoices yet
					</h3>
					<p className="text-gray-500">
						Start by uploading an invoice text above.
					</p>
				</div>
			)}
		</div>
	);
};

export default InvoiceList;
