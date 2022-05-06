import React, { Component } from 'react';
//import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

//const root = ReactDOM.createRoot(document.getElementById('root'));
//root.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>
//);

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
            table: "writers"
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
                //'Access-Control-Allow-Origin': '*',
                //'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                //'Access-Control-Allow-Methods': 'POST',
                //'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(this.state)
        };
        await fetch(url, options)
            .then(response => console.log(response));
    }

    render() {
        console.log("Hello world: " , this.state);
        return (
            <div style ={{textAlign: 'center'}}>
                <div style={{margin: '4em'}} />
                <h1>ShuffleStack: StackExchange Analytic Search</h1>
			<p>A data tool to facilitate research of the StackExchange Q&A database, best used to compare patterns between its communities and between queries. <br />
            This database is current up to March 7, 2022 and made available through the Internet Archive under a Creative Commons license (CC-BY-SA).<br />
            As a derivative work, all relevant source code for this tool can be found (here) as required by the license.<br />
            No posts are used directly without attribution. For a more content-centric search, see StackExchange's own search, and consider creating an account to see more than 500 results.</p>
            <div className="form-container" style={{textAlign: 'left'}}>
            	<form className="form" onSubmit={this.handleSubmit}>
                	<input type="checkbox" name="includequestion" id="includequestion" value={this.state.isquestion} onChange={this.handleChange}/><label>Questions</label><br />
                    Include:
                     <input type="checkbox" name="includesatisfied" id="includesatisfied" value={this.state.includesatisfied} onChange={this.handleChange}/><label>Satisfied</label>
                     <input type="checkbox" name="includeunsatisfied" id="includeunsatisfied" value={this.state.includeunsatisfied} onChange={this.handleChange}/><label>Unsatisfied</label><br />
                     <input type="text" name="viewsmin" id="viewsmin" size="2" value={this.state.viewsmin} onChange={this.handleChange}/><label>Minimum Views</label><br />
                     <input type="text" name="viewsmax" id="viewsmax" size="2" value={this.state.viewsmax} onChange={this.handleChange}/><label>Maximum Views</label><br />
                     <textarea name="tags" id="tags" rows="1" value={this.state.tags} onChange={this.handleChange}/><label>Tags</label>< br/>
                     <textarea name="title" id="title" rows="1" value={this.state.title} onChange={this.handleChange}/><label>Title</label>< br/>
                    <hr />
                    <input type="checkbox" name="includeanswer" id="includeanswer" value={this.state.includeanswer} onChange={this.handleChange}/><label>Answers</label><br />
                    Include:
                    <input type="checkbox" name="includeaccepted" id="includeaccepted" value={this.state.includeaccepted} onChange={this.handleChange}/><label>Accepted</label>
                    <input type="checkbox" name="includeother" value={this.state.includeother} onChange={this.handleChange}/><label>Other</label><br />
                    <hr />
                    Minimum:<input type="datetime-local" name="datemin" id="adatemin" value={this.state.datemin} onChange={this.handleChange}/><label>Date </label>
                            <input type="text" name="scoremin" id="ascoremin" size="2" value={this.state.scoremin} onChange={this.handleChange}/><label>Score</label><br />
                    Maximum:<input type="datetime-local" name="datemax" id="adatemax" value={this.state.datemax} onChange={this.handleChange}/><label>Date </label>
                            <input type="text" name="scoremax" id="ascoremax" size="2" value={this.state.scoremax} onChange={this.handleChange}/><label>Score</label><br />
                    <textarea name="body" id="body" rows="1" value={this.state.body} onChange={this.handleChange}/><label>Body</label>< br/>
                    <select name="table" id="table" value={this.state.table} onChange={this.handleChange}><option value="stackoverflow"/><option value="writing"/></select><label>Category</label><br />
                    <input type="submit" name="submit" id="submit" value="Submit"></input>
                </form>
            </div>
            </div>
        )
    }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
