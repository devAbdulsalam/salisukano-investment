/* eslint-disable react/prop-types */
// import React from 'react';
import DropDowns from './DropDowns';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
const graphDropdown = [{ name: 'Daily' }];

const options = {
	chart: {
		type: 'pie',
		height: 120,
		width: 128,
	},
	title: false,
	series: [
		{
			name: 'Data',
			data: [[23], [13], [62]],
		},
	],
	exporting: {
		enabled: false,
	},
	credits: {
		enabled: false,
	},
	responsive: {
		rules: [
			{
				condition: {
					maxWidth: 100,
				},
			},
		],
	},
	legend: {
		enabled: false,
	},
	plotOptions: {
		pie: {
			borderWidth: 0,
			innerSize: '60%',
			dataLabels: {
				enabled: false,
			},
			showInLegend: true,
			colors: ['#E5E5E5', '#18CDCA', '#4F80E1'],
			states: {
				hover: {
					brightness: 0.1,
				},
			},
		},
	},
};

const Charts = ({ data }) => {
	const options2 = {
		chart: {
			type: 'column',
			height: 150,
		},
		xAxis: {
			categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		},
		yAxis: {
			lineColor: 'transparent',
			title: {
				text: null,
			},
			labels: {
				enabled: false,
			},
			gridLineWidth: 2,
		},
		title: false,
		series: data?.sales
			? data?.sales
			: [
					{
						name: 'Mix',
						data: [5, 3, 4, 7, 2, 6, 8],
					},
					{
						name: 'Cast',
						data: [2, 2, 2, 2, 3, 8, 10],
					},
					{
						name: 'Spacials',
						data: [2, 2, 1, 2, 1, 7, 6],
					},
					{
						name: 'Bundle',
						data: [2, 2, 1, 2, 1, 7, 6],
					},
				],
		responsive: {
			rules: [
				{
					condition: {
						maxWidth: 500,
					},
				},
			],
		},
		exporting: {
			enabled: false,
		},
		credits: {
			enabled: false,
		},
		legend: {
			align: 'left',
			verticalAlign: 'top',
			x: -14,
			y: -12,
			enabled: true,
		},
		plotOptions: {
			pie: {
				borderWidth: 0,
				innerSize: '60%',
				dataLabels: {
					enabled: false,
				},
				showInLegend: true,
				colors: ['#18CDCA', '#4F80E1'],
				states: {
					hover: {
						brightness: 0.1,
					},
				},
			},
		},
	};
	return (
		<>
			<div className="px-4 pt-4 pb-7 bg-white flex-col gap-1 justify-between  w-full max-h-64 xl:col-span-3 xl:row-start-2 lg:row-start-3 rounded-xl border border-[#E7E7E7]">
				<span className="text-[#212B36] text-base font-semibold -tracking-[0.15px]">
					Customer Volume
				</span>
				<div className="flex justify-between sm:flex-col md:flex-row max-w-xs 2xl:max-w-none h-full max-h-60 md:pb-5">
					<div className="sm:mt-2 md:mt-0 self-center md:self-end">
						<div className="flex gap-1 items-center">
							<div className="h-2 w-3 bg-[#497AF9] rounded-sm"></div>
							<div className="text-[10px] flex gap-1">
								<span className="">62%</span>
								<span className="text-[#637381]">New</span>
							</div>
						</div>
						<div className="flex gap-1 items-center">
							<div className="h-2 w-3 bg-[#18CDCA] rounded-sm"></div>
							<div className="text-[10px] flex gap-1">
								<span>13% </span>
								<span className="text-[#637381]">Returning</span>
							</div>
						</div>
						<div className="flex gap-1 items-center">
							<div className="h-2 w-3 bg-[#000000]/20 rounded-sm"></div>
							<div className="text-[10px] flex gap-1">
								<span>23%</span>
								<span className="text-[#637381]">Inactive</span>
							</div>
						</div>
					</div>
					<HighchartsReact highcharts={Highcharts} options={options} />
				</div>
			</div>
			<div className="px-4 py-4 bg-white flex-col row-start-3 col-span-12 w-full max-h-64 xl:col-span-6 xl:row-start-2 lg:row-start-3 rounded-xl border border-[#E7E7E7] ">
				<div className="flex flex-col justify-between">
					<div className="flex items-center justify-between mb-2">
						<span className="text-[#212B36] text-base font-semibold -tracking-[0.15px] whitespace-nowrap">
							Sales Volume
						</span>
						<div className=" block sm:hidden">
							<DropDowns list={graphDropdown} />
						</div>
					</div>
					<div className="flex justify-between">
						<div className=" w-full  h-full">
							<HighchartsReact highcharts={Highcharts} options={options2} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Charts;
