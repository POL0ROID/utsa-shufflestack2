import React, { Component } from 'react';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title,  Tooltip, Legend } from 'chart.js';
import { Line, Doughnut, Bars } from 'react-chartjs-2';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Search />
  </React.StrictMode>
);

const years = [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const datelabels = [];
for (const year of years){
	for (const month of months){
		datelabels.push(year + '-' + month);
	}
}
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const acO = {
	plugins: {
		title: {
			display: true,
			text: "Number of Answers VS Instances of Each"
		}
	}
};

const vcO = {
	plugins: {
		title: {
			display: true,
			text: "Number of Views VS Instances of Each"
		}
	}
};

const scO = {
	plugins: {
		title: {
			display: true,
			text: "Score VS Instances of Each"
		}
	}
};

const uaO = {
	plugins: {
		title: {
			display: true,
			text: "Unanswered Questions Over Time"
		}
	}
}

const daO = {
	plugins: {
		title: {
			display: true,
			text: "Posts Over Time"
		}
	}
}

const toO = {
	plugins: {
		title: {
			display: true,
			text: "Matching Posts"
		}
	}
}
function populateCharts(thisquery, response){
	const toD = {
		//labels,
		//datasets:
		//{
		//data:
	}
	return 1;
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
	    charts: false
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
        alert("Submitted")
        event.preventDefault();            
        const url = 'https://zcxlabs.redtype.consulting/query'
        // const url = 'http://ec2-3-94-209-176.compute-1.amazonaws.com:3001/stackserve.js'
        // const url = 'localhost:3001/stackserve.js'
        const options = {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(this.state)
        };
	const thisquery = this.state;
	const res =
        await fetch(url, options)
            .then(response => res);
	console.log(res[0].rows);
	populateCharts(thisquery, res);
    }

    render() {
        console.log("Current state:" , this.state);
        return (
	<div>
	<head>
		<title>Shufflestack</title>
	</head>
	<body style="background-color: #282c34;">
            <div style={{textAlign: 'center'}}>
                <div style={{margin: '4em'}} />
                <h1>Shufflestack: StackExchange Analytic Search</h1>
			<p>A data tool to facilitate research of the StackExchange Q&A database, best used to compare patterns between its communities and between queries. <br />
            This database is current up to March 7, 2022 and made available through the Internet Archive under a Creative Commons license (CC-BY-SA).<br />
            As a derivative work, all relevant source code for this tool can be found <a href="https://www.github.com/POL0ROID/utsa-shufflestack2">here</a> as required by the license.<br />
            No posts are used directly without attribution. For a more content-centric search, see StackExchange's own search, and consider creating an account to see more than 500 results.</p>
            <div className="form-container">
            	<form className="form" onSubmit={this.handleSubmit}>
			<input type="checkbox" name="advsearch" id="advsearch" value={this.state.advsearch} onChange={this.handleChange}/><label>Enable Advanced Search</label><br />
			<hr />
                	<input type="checkbox" name="includequestion" id="includequestion" value={this.state.isquestion} onChange={this.handleChange}/><label>Questions</label><br />
                    Include:
                     <input type="checkbox" name="includesatisfied" id="includesatisfied" value={this.state.includesatisfied} onChange={this.handleChange}/><label>Satisfied</label>
                     <input type="checkbox" name="includeunsatisfied" id="includeunsatisfied" value={this.state.includeunsatisfied} onChange={this.handleChange}/><label>Unsatisfied</label><br />
                     <input type="text" name="viewsmin" id="viewsmin" value={this.state.viewsmin} onChange={this.handleChange}/><label>Minimum Views</label><br />
                     <input type="text" name="viewsmax" id="viewsmax" value={this.state.viewsmax} onChange={this.handleChange}/><label>Maximum Views</label><br />
                     <textarea name="tags" id="tags" rows="1" value={this.state.tags} onChange={this.handleChange}/><label>Tags</label>< br/>
                     <textarea name="title" id="title" rows="1" value={this.state.title} onChange={this.handleChange}/><label>Title</label>< br/>
                    <hr />
                    <input type="checkbox" name="includeanswer" id="includeanswer" value={this.state.includeanswer} onChange={this.handleChange}/><label>Answers</label><br />
                    Include:
                    <input type="checkbox" name="includeaccepted" id="includeaccepted" value={this.state.includeaccepted} onChange={this.handleChange}/><label>Accepted</label>
                    <input type="checkbox" name="includeother" id="includeother" value={this.state.includeother} onChange={this.handleChange}/><label>Other</label><br />
                    <hr />
                    Minimum:<input type="datetime-local" name="datemin" id="adatemin" value={this.state.datemin} onChange={this.handleChange}/><label>Date </label>
                            <input type="text" name="scoremin" id="scoremin" value={this.state.scoremin} onChange={this.handleChange}/><label>Score</label><br />
                    Maximum:<input type="datetime-local" name="datemax" id="adatemax" value={this.state.datemax} onChange={this.handleChange}/><label>Date </label>
                           <input type="text" name="scoremax" id="scoremax" value={this.state.scoremax} onChange={this.handleChange}/><label>Score</label><br />
                    <textarea name="body" id="body" rows="1" value={this.state.body} onChange={this.handleChange}/><label>Body</label>< br/>
                    <div><select name="table" id="table" value={this.state.table} onChange={this.handleChange} required>
		<optgroup label="Main"><option value="stackoverflow">Stack Overflow (very slow)</option>
		<option value="stackexchange">Stack Exchange</option></optgroup>
		<option value="academia">Academia</option>
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
		<option value="aviation">Aviation</option>
		<option value="alcohol">Beer, Wine & Spirits</option>
		<option value="hermeneutics">Biblical Hermeneutics</option>
		<option value="biology">Biology</option>
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
		<option value="datascience">Data Science</option>
		<option value="dba">Database Administrators</option>
		<option value="devops">DevOps</option>
		<option value="drones">Drones and Model Aircraft</option>
		<option value="drupal">Drupal Answers</option>
		<option value="earthscience">Earth Science</option>
		<option value="ebooks">Ebooks</option>
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
		<option value="writers">Writers</option>
		</select>
		</div>
		<label>Category</label><br />
                    <input type="submit" name="submit" id="submit" value="Submit"></input>
                </form>
            </div>
            </div>
	</body>
	</div>
        );
    }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
