import React, { Component, useImperativeHandle, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut, Bar, getDatasetAtEvent } from 'react-chartjs-2';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import reportWebVitals from './reportWebVitals';

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
	},
	}));

function populateLabels(thisquery, response){
	const min = Math.min(response[0][0], thisquery.scoremin);
	const max = Math.max(response[response.length - 1][0], thisquery.scoremax);
	let range = [];
	for(let i=min; i<max+1; i++){
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
	const yearmin = Math.min(response[0][0], parseInt(thisquery.datemin.slice(0,4)));
	const monthmin = Math.min(response[0][1], parseInt(thisquery.datemin.slice(5,7)));
	const yearmax = Math.min(response[response.length-1][0], parseInt(thisquery.datemax.slice(0,4)));
	const monthmax = Math.min(response[response.length-1][1], parseInt(thisquery.datemax.slice(5,7)));
	const yearrange = yearmax - yearmin;
	const monthrange = monthmax - monthmin;
	const range = [];
	if(yearmin != yearmax){
		for(let i=monthmin; i<(yearrange*12+monthrange+monthmin); i++){
			range.push(`${yearmin+(Math.floor(i/12))}-${i%12 == 0 ? 12 : i%12}`);
		}
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
		ansc = (responses[0].rows).concat(responses[1].rows);
		anscl = populateLabels(thisquery, ansc);
		view = responses[2].rows;
		viewl = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 22000, 24000, 26000, 28000, 30000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 300000, 99999999];
		unans = responses[3].rows;
		unansl = populateRange(thisquery, unans);
		unansd = populateDates(unans);
		total = [(responses[5].rows)[0][1]-(responses[4].rows)[0][0]].concat(parseInt((responses[4].rows)[0][0]));
		total = total.concat((responses[5].rows)[1][1]-(responses[4].rows)[0][0]).concat(parseInt((responses[4].rows)[0][0]));
		totall = ["Unsatisfied Questions", "Satisfied Questions", "Unaccepted Answers", "Accepted Answers"];
		score = responses[6].rows;
		date = responses[7].rows;
	}
	else{
		console.log((responses[0].rows)[0][1]);
		total = [(responses[0].rows)[0][1]].concat((responses[0].rows)[1][1]);
		totall = ["Questions", "Answers"];
		score = responses[1].rows;
		date = responses[2].rows;
	}
	const scorel = populateLabels(thisquery, score);
	const datel = populateRange(thisquery, date);
	mylabels.push(totall, scorel, datel);
	data.push(total, score, date);
	if(responses.length > 3){
		mylabels.push(anscl, viewl, unansl);
		data.push(ansc, view, unansd);
	}
	else{
		mylabels.push("blah", "blah", "blah")
		data.push([0], [0], [0])
	}
	console.log(mylabels);
	console.log(data);
	for(let i=0; i<6; i++){
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
			viewsmin: "",
			viewsmax: "",
			includeanswer: false,
			includeaccepted: false,
			includeother: false,
			datemin: "",
			scoremin: "",
			datemax: "",
			scoremax: "",
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
		const target = event.target;
		const value = (target.type === 'checkbox') ? target.checked : target.value;
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
		const thisquery = this.state;
		this.setState({hide: true});
		this.setState({done: false});
		await fetch(url, options)
			.then(res => res.json())
			.then(data => {
				this.state.charts = data;
			});
		console.log(this.state.charts);
		populateCharts(thisquery, this.state.charts);
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
							<div><input type="text" size="3" name="viewsmin" id="viewsmin" value={this.state.viewsmin} onChange={this.handleChange}/>
							<label>=&gt;</label><input type="text" size="3" name="viewsmax" id="viewsmax" value={this.state.viewsmax} onChange={this.handleChange}/></div>
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
						<div><input type="text" size="3" name="scoremin" id="scoremin" value={this.state.scoremin} onChange={this.handleChange}/>
						<label>=&gt;</label><input type="text" size="3" name="scoremax" id="scoremax" value={this.state.scoremax} onChange={this.handleChange}/></div>
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
				{this.state.charts.length > 0 && charts}
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
