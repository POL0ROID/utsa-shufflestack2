import React, { Component, useImperativeHandle, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut, Bar, getDatasetAtEvent } from 'react-chartjs-2';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import reportWebVitals from './reportWebVitals';
import 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const opt = [
	"Matching Posts",
	"Score VS Instances of Each",
	"Posts Over Time",
	"Number of Answers VS Instances of Each",
	"Number of Views VS Instances of Each",
	"Unanswered Questions Over Time"
]
	.map(str => ({
		plugins: {
			title: {
				display: true,
				text: str,
			},
			zoom: {
				wheel: {
					enabled: true
				},
				pinch: {
					enabled: true
				},
				mode: 'xy'
			},
			pan: {
				enabled: true,
				mode: 'xy'
			}
		},
	}));

function populateLabels(response, min, max){
	min = min != null ? min : -99999;
	max = max != null ? max : 99999;
	const mymin = Math.max(parseInt(response[0][0]), min);
	const mymax = Math.min(parseInt(response[response.length - 1][0]), max);
	let range = [];
	for(let i=mymin; i<mymax+1; i++){
		range.push(i);
	}
	return range;
}

function populateDates(response){
	let dates = [];
	for(let i=0; i<response.length; i++){
		let row = [];
		row.push(`${response[i][0]}-${response[i][1]}`);
		row.push(response[i][2]);
		dates.push(row);
	}
	return dates;
}

function populateRange(thisquery, response){
	let datemin = thisquery.datemin != "" ? thisquery.datemin : "2008-01-01T01:01:01";
	let datemax = thisquery.datemax != "" ? thisquery.datemax : "2022-03-31T23:59:59";
	let yearmin = Math.max(parseInt(response[0][0]), parseInt(datemin.slice(0,4)));
	let monthmin = Math.max(parseInt(response[0][1]), parseInt(datemin.slice(5,7)));
	let yearmax = Math.min(parseInt(response[response.length-1][0]), parseInt(datemax.slice(0,4)));
	let monthmax = Math.min(parseInt(response[response.length-1][1]), parseInt(datemax.slice(5,7)));
	let yearrange = yearmax - yearmin;
	let monthrange = monthmax - monthmin;
	let range = [""];
	range.pop();
	for(let i=monthmin; i<(yearrange*12+monthrange+monthmin); i++){
		range.push(`${yearmin+(Math.floor(i/12))}-${i%12 == 0 ? 12 : i%12}`);
	}
	return range;
}

function populateCharts(thisquery, responses){
	let charts = [];
	let mylabels = [];
	let data = [];
	let ansc = [];
	let anscl = [];
	let view = [];
	let viewl = [];
	let unans = [];
	let unansl = [];
	let unansd = [];
	let total = [];
	let totall = [];
	let score = [];
	let date = [];
	if(responses.length > 3){
		let zeros = responses[0].rows[0][0];
		ansc = ((([(['0'].concat(responses[0].rows[0][0]))]).concat(responses[1].rows)).map(elem => [parseInt(elem[0], 10), parseInt(elem[1], 10)]));
		anscl = populateLabels(ansc, 0, 99999);
		view = responses[2].rows.map(elem => [parseInt(elem[0], 10), parseInt(elem[1], 10)]);
		console.log(view);
		viewl = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 22000, 24000, 26000, 28000, 30000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 300000, 99999999];
		unans = responses[3].rows;
		unansl = populateRange(thisquery, unans);
		unansd = populateDates(unans).map(elem => [parseInt(elem[0], 10), parseInt(elem[1], 10)]);
		total = [([(responses[5].rows)[0][1]]-[(responses[4].rows)[0][0]])].concat(parseInt((responses[4].rows)[0][0]));
		total = total.concat([(responses[5].rows)[1][1]]-(responses[4].rows)[0][0]).concat(parseInt((responses[4].rows)[0][0]));
		totall = ["Unsatisfied Questions", "Satisfied Questions", "Unaccepted Answers", "Accepted Answers"];
		score = (responses[6].rows).map(elem => [parseInt(elem[0], 10), parseInt(elem[1], 10)]);
		date = responses[7].rows;
	}
	else{
		total = [(responses[0].rows)[0][1]].concat((responses[0].rows)[1][1]);
		totall = ["Questions", "Answers"];
		score = (responses[1].rows).map(elem => [parseInt(elem[0], 10), parseInt(elem[1], 10)]);
		date = responses[2].rows;
	}
	let scorel = populateLabels(score, thisquery.scoremin, thisquery.scoremax);
	let datel = populateRange(thisquery, date);
	let dated = (populateDates(date)).map(elem => [elem[0], parseInt(elem[1], 10)]);
	mylabels.push(totall, scorel, datel);
	data.push(total, score, dated);
	if(responses.length > 3){
		mylabels.push(anscl, viewl, unansl);
		data.push(ansc, view, unansd);
	}
	else{
		mylabels.push("blah", "blah", "blah")
		data.push([0], [0], [0])
	}
	for(let i=0; i<responses.length; i++){
		charts.push({
			labels: mylabels[i],
			datasets: [
				{
					data: data[i],
				}
			]
		});
	}
	return charts;
}

export default class Search extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			includequestion: false,
			includesatisfied: false,
			includeunsatisfied: false,
			viewsmin: null,
			viewsmax: null,
			includeanswer: false,
			includeaccepted: false,
			includeother: false,
			datemin: "",
			scoremin: null,
			datemax: "",
			scoremax: null,
			title: "",
			body: "",
			tags: "", 
			table: "writers",
			advsearch: false,
			done: true,
			hide: true,
			charts: []
		};
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleChange = (event) => {
		let t = {};
		let target = event.target;
		let value = (target.type === 'checkbox') ? target.checked : target.value;
		t[target.id] = value;
		this.setState( { ...t } );
	}

	handleSubmit = async (event) => {
		event.preventDefault();
		const url = 'https://zcxlabs.redtype.consulting/query'
		// const url = 'http://ec2-3-94-209-176.compute-1.amazonaws.com:3001/server.js'
		//const url = '/query'
		const options = {
			method: 'POST',
			headers: {
			'Accept': '*/*',
			'Content-Type': 'application/json;charset=UTF-8',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
			'Access-Control-Allow-Methods': 'POST',
			'Access-Control-Allow-Credentials': true
			},
			body: JSON.stringify(this.state)
		};
		let thisquery = this.state;
		this.setState({hide: true});
		this.setState({done: false});
		//await fetch(url, options)
		//	.then(res => res.json())
		//	.then(data => {
				this.state.charts = [{ "command": "SELECT", "rowCount": 1, "oid": null, "rows": [ [ "35787" ] ], "fields": [ { "name": "count", "tableID": 0, "columnID": 0, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" } ], "_parsers": [ null ], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": true },
				{ "command": "SELECT", "rowCount": 27, "oid": null, "rows": [ [ "1", "2887" ], [ "2", "2666" ], [ "3", "1848" ], [ "4", "1248" ], [ "5", "816" ], [ "6", "478" ], [ "7", "350" ], [ "8", "202" ], [ "9", "137" ], [ "10", "102" ], [ "11", "66" ], [ "12", "59" ], [ "13", "34" ], [ "14", "31" ], [ "15", "19" ], [ "16", "16" ], [ "17", "9" ], [ "18", "2" ], [ "19", "4" ], [ "20", "2" ], [ "21", "3" ], [ "22", "2" ], [ "23", "1" ], [ "24", "2" ], [ "25", "2" ], [ "26", "1" ], [ "41", "1" ] ], "fields": [ { "name": "answers", "tableID": 2702385, "columnID": 3, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" }, { "name": "count", "tableID": 0, "columnID": 0, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" } ], "_parsers": [ null, null ], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": true },
				{ "command": "SELECT", "rowCount": 45, "oid": null, "rows": [ [ 100, "1954" ], [ 200, "2390" ], [ 300, "1170" ], [ 400, "719" ], [ 500, "485" ], [ 600, "379" ], [ 700, "316" ], [ 800, "230" ], [ 900, "216" ], [ 1000, "179" ], [ 2000, "1066" ], [ 3000, "588" ], [ 4000, "360" ], [ 5000, "250" ], [ 6000, "192" ], [ 7000, "147" ], [ 8000, "101" ], [ 9000, "90" ], [ 10000, "51" ], [ 11000, "55" ], [ 12000, "32" ], [ 13000, "34" ], [ 14000, "23" ], [ 15000, "22" ], [ 16000, "19" ], [ 17000, "17" ], [ 18000, "17" ], [ 19000, "17" ], [ 20000, "21" ], [ 22000, "21" ], [ 24000, "13" ], [ 26000, "12" ], [ 28000, "15" ], [ 30000, "16" ], [ 40000, "24" ], [ 60000, "20" ], [ 80000, "11" ], [ 100000, "6" ], [ 120000, "6" ], [ 140000, "3" ], [ 160000, "5" ], [ 180000, "3" ], [ 200000, "2" ], [ 300000, "2" ], [ 99999999, "3" ] ], "fields": [ { "name": "viewcount", "tableID": 2702380, "columnID": 7, "dataTypeID": 23, "dataTypeSize": 4, "dataTypeModifier": -1, "format": "text" }, { "name": "count", "tableID": 0, "columnID": 0, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" } ], "_parsers": [ null, null ], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": true },
				{ "command": "SELECT", "rowCount": 108, "oid": null, "rows": [ [ "2011", "2", "1" ], [ "2011", "3", "4" ], [ "2011", "5", "1" ], [ "2011", "6", "1" ], [ "2011", "8", "2" ], [ "2011", "9", "1" ], [ "2011", "11", "2" ], [ "2011", "12", "1" ], [ "2012", "1", "1" ], [ "2012", "2", "2" ], [ "2012", "3", "1" ], [ "2012", "5", "1" ], [ "2012", "6", "2" ], [ "2012", "8", "1" ], [ "2012", "11", "2" ], [ "2013", "4", "1" ], [ "2013", "5", "1" ], [ "2013", "6", "1" ], [ "2013", "7", "1" ], [ "2013", "9", "2" ], [ "2013", "10", "2" ], [ "2013", "11", "1" ], [ "2013", "12", "2" ], [ "2014", "4", "1" ], [ "2014", "5", "1" ], [ "2014", "8", "7" ], [ "2014", "10", "1" ], [ "2014", "11", "3" ], [ "2014", "12", "4" ], [ "2015", "1", "1" ], [ "2015", "2", "2" ], [ "2015", "3", "2" ], [ "2015", "4", "1" ], [ "2015", "5", "1" ], [ "2015", "7", "1" ], [ "2015", "8", "3" ], [ "2015", "9", "1" ], [ "2015", "10", "2" ], [ "2015", "11", "1" ], [ "2015", "12", "1" ], [ "2016", "1", "2" ], [ "2016", "3", "3" ], [ "2016", "5", "1" ], [ "2016", "7", "4" ], [ "2016", "8", "1" ], [ "2016", "9", "2" ], [ "2016", "11", "2" ], [ "2016", "12", "4" ], [ "2017", "1", "1" ], [ "2017", "2", "3" ], [ "2017", "3", "1" ], [ "2017", "5", "3" ], [ "2017", "6", "6" ], [ "2017", "7", "1" ], [ "2017", "8", "1" ], [ "2017", "9", "7" ], [ "2017", "10", "4" ], [ "2017", "11", "3" ], [ "2018", "1", "2" ], [ "2018", "2", "1" ], [ "2018", "3", "4" ], [ "2018", "4", "7" ], [ "2018", "5", "3" ], [ "2018", "6", "8" ], [ "2018", "7", "2" ], [ "2018", "8", "4" ], [ "2018", "9", "1" ], [ "2018", "11", "1" ], [ "2018", "12", "1" ], [ "2019", "1", "1" ], [ "2019", "2", "3" ], [ "2019", "3", "6" ], [ "2019", "4", "1" ], [ "2019", "5", "5" ], [ "2019", "6", "6" ], [ "2019", "7", "4" ], [ "2019", "8", "1" ], [ "2019", "9", "5" ], [ "2019", "10", "3" ], [ "2019", "11", "7" ], [ "2019", "12", "2" ], [ "2020", "1", "5" ], [ "2020", "2", "7" ], [ "2020", "3", "9" ], [ "2020", "4", "5" ], [ "2020", "5", "13" ], [ "2020", "6", "7" ], [ "2020", "7", "7" ], [ "2020", "8", "10" ], [ "2020", "9", "5" ], [ "2020", "10", "9" ], [ "2020", "11", "5" ], [ "2020", "12", "4" ], [ "2021", "1", "6" ], [ "2021", "2", "11" ], [ "2021", "3", "11" ], [ "2021", "4", "6" ], [ "2021", "5", "13" ], [ "2021", "6", "7" ], [ "2021", "7", "8" ], [ "2021", "8", "11" ], [ "2021", "9", "4" ], [ "2021", "10", "12" ], [ "2021", "11", "4" ], [ "2021", "12", "9" ], [ "2022", "1", "17" ], [ "2022", "2", "15" ], [ "2022", "3", "6" ] ], "fields": [ { "name": "year", "tableID": 2702380, "columnID": 2, "dataTypeID": 1700, "dataTypeSize": -1, "dataTypeModifier": -1, "format": "text" }, { "name": "month", "tableID": 2702380, "columnID": 3, "dataTypeID": 1700, "dataTypeSize": -1, "dataTypeModifier": -1, "format": "text" }, { "name": "count", "tableID": 0, "columnID": 0, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" } ], "_parsers": [ null, null, null ], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": true },
				{ "command": "SELECT", "rowCount": 1, "oid": null, "rows": [ [ "5683" ] ], "fields": [ { "name": "count", "tableID": 0, "columnID": 0, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" } ], "_parsers": [ null ], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": true },
				{ "command": "SELECT", "rowCount": 2, "oid": null, "rows": [ [ 1, "11302" ], [ 2, "35473" ] ], "fields": [ { "name": "posttypeid", "tableID": 2702380, "columnID": 1, "dataTypeID": 21, "dataTypeSize": 2, "dataTypeModifier": -1, "format": "text" }, { "name": "count", "tableID": 0, "columnID": 0, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" } ], "_parsers": [ null, null ], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": true },
				{ "command": "SELECT", "rowCount": 118, "oid": null, "rows": [ [ -9, "2" ], [ -8, "2" ], [ -7, "2" ], [ -6, "8" ], [ -5, "19" ], [ -4, "37" ], [ -3, "59" ], [ -2, "179" ], [ -1, "494" ], [ 0, "6350" ], [ 1, "9020" ], [ 2, "7468" ], [ 3, "5581" ], [ 4, "3916" ], [ 5, "2874" ], [ 6, "2121" ], [ 7, "1570" ], [ 8, "1191" ], [ 9, "879" ], [ 10, "713" ], [ 11, "524" ], [ 12, "479" ], [ 13, "421" ], [ 14, "322" ], [ 15, "254" ], [ 16, "228" ], [ 17, "177" ], [ 18, "205" ], [ 19, "152" ], [ 20, "157" ], [ 21, "117" ], [ 22, "104" ], [ 23, "95" ], [ 24, "67" ], [ 25, "66" ], [ 26, "60" ], [ 27, "53" ], [ 28, "49" ], [ 29, "52" ], [ 30, "48" ], [ 31, "44" ], [ 32, "51" ], [ 33, "51" ], [ 34, "34" ], [ 35, "35" ], [ 36, "29" ], [ 37, "27" ], [ 38, "22" ], [ 39, "20" ], [ 40, "26" ], [ 41, "21" ], [ 42, "14" ], [ 43, "12" ], [ 44, "17" ], [ 45, "18" ], [ 46, "18" ], [ 47, "10" ], [ 48, "9" ], [ 49, "9" ], [ 50, "4" ], [ 51, "6" ], [ 52, "9" ], [ 53, "9" ], [ 54, "9" ], [ 55, "9" ], [ 56, "9" ], [ 57, "5" ], [ 58, "6" ], [ 59, "7" ], [ 60, "6" ], [ 61, "7" ], [ 62, "7" ], [ 63, "4" ], [ 64, "2" ], [ 65, "3" ], [ 66, "7" ], [ 67, "2" ], [ 68, "2" ], [ 69, "3" ], [ 70, "1" ], [ 71, "6" ], [ 72, "5" ], [ 73, "4" ], [ 74, "3" ], [ 75, "4" ], [ 76, "1" ], [ 77, "3" ], [ 78, "3" ], [ 79, "1" ], [ 80, "3" ], [ 82, "3" ], [ 83, "4" ], [ 84, "3" ], [ 86, "1" ], [ 88, "1" ], [ 89, "3" ], [ 90, "1" ], [ 91, "2" ], [ 92, "1" ], [ 95, "1" ], [ 97, "3" ], [ 99, "1" ], [ 100, "1" ], [ 101, "1" ], [ 103, "2" ], [ 104, "1" ], [ 107, "2" ], [ 113, "1" ], [ 114, "1" ], [ 116, "1" ], [ 117, "1" ], [ 131, "2" ], [ 133, "1" ], [ 140, "1" ], [ 145, "1" ], [ 180, "1" ], [ 189, "1" ], [ 216, "1" ] ], "fields": [ { "name": "score", "tableID": 2702380, "columnID": 6, "dataTypeID": 23, "dataTypeSize": 4, "dataTypeModifier": -1, "format": "text" }, { "name": "count", "tableID": 0, "columnID": 0, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" } ], "_parsers": [ null, null ], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": true },
				{ "command": "SELECT", "rowCount": 139, "oid": null, "rows": [ [ "2010", "9", "2" ], [ "2010", "10", "2" ], [ "2010", "11", "594" ], [ "2010", "12", "352" ], [ "2011", "1", "227" ], [ "2011", "2", "477" ], [ "2011", "3", "472" ], [ "2011", "4", "308" ], [ "2011", "5", "205" ], [ "2011", "6", "268" ], [ "2011", "7", "221" ], [ "2011", "8", "280" ], [ "2011", "9", "279" ], [ "2011", "10", "218" ], [ "2011", "11", "169" ], [ "2011", "12", "184" ], [ "2012", "1", "176" ], [ "2012", "2", "173" ], [ "2012", "3", "187" ], [ "2012", "4", "151" ], [ "2012", "5", "213" ], [ "2012", "6", "150" ], [ "2012", "7", "94" ], [ "2012", "8", "121" ], [ "2012", "9", "89" ], [ "2012", "10", "130" ], [ "2012", "11", "133" ], [ "2012", "12", "181" ], [ "2013", "1", "215" ], [ "2013", "2", "152" ], [ "2013", "3", "123" ], [ "2013", "4", "209" ], [ "2013", "5", "179" ], [ "2013", "6", "246" ], [ "2013", "7", "203" ], [ "2013", "8", "186" ], [ "2013", "9", "247" ], [ "2013", "10", "177" ], [ "2013", "11", "272" ], [ "2013", "12", "234" ], [ "2014", "1", "287" ], [ "2014", "2", "174" ], [ "2014", "3", "171" ], [ "2014", "4", "169" ], [ "2014", "5", "157" ], [ "2014", "6", "201" ], [ "2014", "7", "171" ], [ "2014", "8", "219" ], [ "2014", "9", "209" ], [ "2014", "10", "233" ], [ "2014", "11", "198" ], [ "2014", "12", "169" ], [ "2015", "1", "270" ], [ "2015", "2", "255" ], [ "2015", "3", "267" ], [ "2015", "4", "280" ], [ "2015", "5", "376" ], [ "2015", "6", "374" ], [ "2015", "7", "397" ], [ "2015", "8", "341" ], [ "2015", "9", "297" ], [ "2015", "10", "301" ], [ "2015", "11", "305" ], [ "2015", "12", "276" ], [ "2016", "1", "426" ], [ "2016", "2", "419" ], [ "2016", "3", "299" ], [ "2016", "4", "279" ], [ "2016", "5", "254" ], [ "2016", "6", "382" ], [ "2016", "7", "275" ], [ "2016", "8", "375" ], [ "2016", "9", "342" ], [ "2016", "10", "236" ], [ "2016", "11", "262" ], [ "2016", "12", "305" ], [ "2017", "1", "585" ], [ "2017", "2", "499" ], [ "2017", "3", "395" ], [ "2017", "4", "388" ], [ "2017", "5", "488" ], [ "2017", "6", "573" ], [ "2017", "7", "403" ], [ "2017", "8", "463" ], [ "2017", "9", "459" ], [ "2017", "10", "552" ], [ "2017", "11", "532" ], [ "2017", "12", "473" ], [ "2018", "1", "721" ], [ "2018", "2", "762" ], [ "2018", "3", "712" ], [ "2018", "4", "742" ], [ "2018", "5", "773" ], [ "2018", "6", "666" ], [ "2018", "7", "614" ], [ "2018", "8", "565" ], [ "2018", "9", "473" ], [ "2018", "10", "519" ], [ "2018", "11", "600" ], [ "2018", "12", "422" ], [ "2019", "1", "770" ], [ "2019", "2", "871" ], [ "2019", "3", "1329" ], [ "2019", "4", "589" ], [ "2019", "5", "692" ], [ "2019", "6", "667" ], [ "2019", "7", "588" ], [ "2019", "8", "641" ], [ "2019", "9", "489" ], [ "2019", "10", "421" ], [ "2019", "11", "233" ], [ "2019", "12", "314" ], [ "2020", "1", "299" ], [ "2020", "2", "314" ], [ "2020", "3", "255" ], [ "2020", "4", "269" ], [ "2020", "5", "317" ], [ "2020", "6", "275" ], [ "2020", "7", "285" ], [ "2020", "8", "280" ], [ "2020", "9", "381" ], [ "2020", "10", "499" ], [ "2020", "11", "328" ], [ "2020", "12", "363" ], [ "2021", "1", "409" ], [ "2021", "2", "267" ], [ "2021", "3", "242" ], [ "2021", "4", "276" ], [ "2021", "5", "281" ], [ "2021", "6", "193" ], [ "2021", "7", "277" ], [ "2021", "8", "236" ], [ "2021", "9", "202" ], [ "2021", "10", "185" ], [ "2021", "11", "174" ], [ "2021", "12", "212" ], [ "2022", "1", "297" ], [ "2022", "2", "177" ], [ "2022", "3", "49" ] ], "fields": [ { "name": "year", "tableID": 2702380, "columnID": 2, "dataTypeID": 1700, "dataTypeSize": -1, "dataTypeModifier": -1, "format": "text" }, { "name": "month", "tableID": 2702380, "columnID": 3, "dataTypeID": 1700, "dataTypeSize": -1, "dataTypeModifier": -1, "format": "text" }, { "name": "count", "tableID": 0, "columnID": 0, "dataTypeID": 20, "dataTypeSize": 8, "dataTypeModifier": -1, "format": "text" } ], "_parsers": [ null, null, null ], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": true }
				];
		//	});
		this.state.charts = populateCharts(thisquery, this.state.charts);
		this.setState({done: true});
		this.setState({hide: false});
	}

	render() {
		let charts = 
		<div hidden={this.state.hide}>
			<Doughnut options={opt[0]} data={this.state.charts[0]}/>
			<Bar options={opt[1]} data={this.state.charts[1]}/>
			<Line options={opt[2]} data={this.state.charts[2]}/>
		</div>
		let advcharts =
		<div hidden={this.state.hide && this.state.advsearch}>
			<Bar options={opt[3]} data={this.state.charts[3]}/>
			<Bar options={opt[4]} data={this.state.charts[4]}/>
			<Line options={opt[5]} data={this.state.charts[5]}/>
		</div>
//		<div hidden={this.state.display}>
//			<Doughnut options={opt[0]} data={this.state.charts[0]} ref={chartRef}/>
//			<Bar options={opt[1]} data={this.state.charts[1]} ref={chartRef}/>
//			<Line options={opt[2]} data={this.state.charts[2]} ref={chartRef}/>
//			<div hidden={this.state.display && this.state.advsearch}>
//				<Bar options={opt[3]} data={this.state.charts[3]} ref={chartRef}/>
//				<Bar options={opt[4]} data={this.state.charts[4]} ref={chartRef}/>
//				<Line options={opt[5]} data={this.state.charts[5]} ref={chartRef}/>
//			</div>
//		</div>;
		console.log("Current state:" , this.state);
		return (
			<body style={{backgroundColor: '#282c34', margin: '0',
				fontFamily: "AppleSystem, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sansSerif,",
				WebkitFontSmoothing: 'antialiased',
				MozOsxFontSmoothing: 'grayscale',
				textAlign: 'center',
				margin: '4em'}}>
					<h1>Shufflestack: Stack Exchange Analytic Search</h1>
				<p>A data tool to facilitate research of the StackExchange Q&A database, best used to compare patterns between its communities and between queries. <br />
				This database is current up to March 7, 2022 and made available through the Internet Archive under a Creative Commons license (CC-BY-SA).<br />
				As a derivative work, all relevant source code for this tool can be found <a href="https://www.github.com/POL0ROID/utsa-shufflestack2">here</a> as required by the license.<br />
				No posts are used directly without attribution. For a more content-centric search, see StackExchange's own search, and consider creating an account to see more than 500 results.</p>
				<div className="form-container">
					<form className="form" onSubmit={this.handleSubmit}>
						<input type="checkbox" name="advsearch" id="advsearch" value={this.state.advsearch} onChange={this.handleChange}/><label>Enable Advanced Search</label><br />
						<hr />
						<input type="checkbox" name="includequestion" id="includequestion" value={this.state.isquestion} onChange={this.handleChange}/><label>Questions</label><br />
						<label>Include:</label>
							<input type="checkbox" name="includesatisfied" id="includesatisfied" value={this.state.includesatisfied} onChange={this.handleChange}/><label>Satisfied</label>
							<input type="checkbox" name="includeunsatisfied" id="includeunsatisfied" value={this.state.includeunsatisfied} onChange={this.handleChange}/><label>Unsatisfied</label><br />
							<label>Views Range:</label>
							<div><input type="number" rows="1" name="viewsmin" id="viewsmin" value={this.state.viewsmin} onChange={this.handleChange}/>
							<label>=&gt;</label><input type="number" rows="1" name="viewsmax" id="viewsmax" value={this.state.viewsmax} onChange={this.handleChange}/></div>
							<label>Tags:</label><div><textarea name="tags" id="tags" rows="1" value={this.state.tags} onChange={this.handleChange}/></div>
							<label>Title:</label><div><textarea name="title" id="title" rows="1" value={this.state.title} onChange={this.handleChange}/></div>
						<hr />
						<input type="checkbox" name="includeanswer" id="includeanswer" value={this.state.includeanswer} onChange={this.handleChange}/><label>Answers</label><br />
						<label>Include:</label>
						<input type="checkbox" name="includeaccepted" id="includeaccepted" value={this.state.includeaccepted} onChange={this.handleChange}/><label>Accepted</label>
						<input type="checkbox" name="includeother" id="includeother" value={this.state.includeother} onChange={this.handleChange}/><label>Other</label><br />
						<hr />
						<label>Date Range:</label>
						<div><input type="datetime-local" name="datemin" id="datemin" value={this.state.datemin} onChange={this.handleChange}/>
						<label>=&gt;</label><input type="datetime-local" name="datemax" id="datemax" value={this.state.datemax} onChange={this.handleChange}/></div>
						<label>Score Range:</label>
						<div><input type="number" rows="1" name="scoremin" id="scoremin" value={this.state.scoremin} onChange={this.handleChange}/>
						<label>=&gt;</label><input type="number" rows="1" name="scoremax" id="scoremax" value={this.state.scoremax} onChange={this.handleChange}/></div>
						<label>Body:</label>
						<div><textarea name="body" id="body" rows="1" value={this.state.body} onChange={this.handleChange}/></div>
						<label>Category</label><div><select name="table" id="table" value={this.state.table} onChange={this.handleChange} required>
							<optgroup label="Main"><option value="stackexchange">Stack Exchange</option>
							<option value="stackoverflow">Stack Overflow (very slow)</option></optgroup>
							<optgroup label="Subjects"><option value="academia">Academia</option>
							<option value="ai">AI</option>
							<option value="ham">Amateur Radio</option>
							<option value="android">Android Enthusiasts</option>
							<option value="anime">Anime & Manga</option>
							<option value="arduino">Arduino</option>
							<option value="gaming">Arqade</option>
							<option value="crafts">Arts & Crafts</option>
							<option value="apple">Ask Different</option>
							<option value="patents">Ask Patents</option>
							<option value="askubuntu">Ask Ubuntu</option>
							<option value="astronomy">Astronomy</option>
							<option value="alcohol">Beer, Wine & Spirits</option>
							<option value="hermeneutics">Biblical Hermeneutics</option>
							<option value="blender">Blender</option>
							<option value="boardgames">Board & Card Games</option>
							<option value="chemistry">Chemistry</option>
							<option value="chess">Chess</option>
							<option value="chinese">Chinese Language</option>
							<option value="christianity">Christianity</option>
							<option value="codegolf">Code Golf</option>
							<option value="codereview">Code Review</option>
							<option value="coffee">Coffee</option>
							<option value="cogsci">CogSci</option>
							<option value="scicomp">Computational Science</option>
							<option value="cseducators">Computer Science Educators</option>
							<option value="cs">Computer Science</option>
							<option value="cstheory">Theoretical Computer Science</option>
							<option value="craftcms">Craft CMS</option>
							<option value="stats">Cross Validated</option>
							<option value="crypto">Cryptography</option>
							<option value="dba">Database Administrators</option>
							<option value="drupal">Drupal Answers</option>
							<option value="economics">Economics</option>
							<option value="electronics">Electric Engineering</option>
							<option value="engineering">Engineering</option>
							<option value="english">English Language & Usage</option>
							<option value="ell">English Language Learners</option>
							<option value="ethereum">Ethereum</option>
							<option value="french">French Language</option>
							<option value="gamedev">Game Development</option>
							<option value="gardening">Gardening & Landscaping</option>
							<option value="gis">Geographic and Information Systems</option>
							<option value="graphicdesign">Graphic Design</option>
							<option value="diy">Home Improvement</option>
							<option value="interpersonal">Interpersonal Skills</option>
							<option value="lifehacks">Lifehacks</option>
							<option value="linguistics">Linguistics</option>
							<option value="magento">Magento</option>
							<option value="mathoverflow">MathOverflow</option>
							<option value="mathematica">Mathematica</option>
							<option value="math">Mathematics (slow)</option>
							<option value="judaism">Mi Yodeya</option>
							<option value="music">Music</option>
							<option value="outdoors">The Great Outdoors</option>
							<option value="parenting">Parenting</option>
							<option value="money">Personal Finance and Money</option>
							<option value="philosophy">Philosophy</option>
							<option value="photo">Photography</option>
							<option value="fitness">Physical Fitness</option>
							<option value="physics">Physics</option>
							<option value="puzzling">Puzzling</option>
							<option value="raspberrypi">Raspberry Pi</option>
							<option value="retrocomputing">Retrocomputing</option>
							<option value="robotics">Robotics</option>
							<option value="rpg">Role-playing Games</option>
							<option value="salesforce">Salesforce</option>
							<option value="scifi">Science Fiction & Fantasy</option>
							<option value="serverfault">Server Fault</option>
							<option value="sharepoint">Sharepoint</option>
							<option value="sitecore">Sitecore</option>
							<option value="softwareengineering">Software Engineering</option>
							<option value="softwarerecs">Software Recommendations</option>
							<option value="sqa">Software Quality Assurance & Testing</option>
							<option value="spanish">Spanish Language</option>
							<option value="superuser">Superuser</option>
							<option value="tex">TeX - LaTeX</option>
							<option value="travel">Travel</option>
							<option value="unix">Unix & Linux</option>
							<option value="ux">User Experience</option>
							<option value="vi">Vi and Vim</option>
							<option value="webmasters">Webmasters</option>
							<option value="wordpress">WordPress Development</option>
							<option value="workplace">The Workplace</option>
							<option value="worldbuilding">Worldbuilding</option>
							<option value="writers">Writers</option></optgroup>
							</select></div>
						<input type="submit" name="submit" id="submit" value="Submit"></input><label hidden = {this.state.done}>Loading...</label><label hidden = {this.state.hide}>Done.</label>
					</form>
				</div>
				{this.state.charts.length > 0 && charts }
				{this.state.charts.length > 3 && advcharts }
			</body>
		);
	}
}

reportWebVitals();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Search />
  </React.StrictMode>
);
