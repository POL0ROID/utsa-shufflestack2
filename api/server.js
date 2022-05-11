const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors')
const { Pool, Client } = require('pg');
const https = require('https');
const fs = require('fs');
const path = require('path');
const parser = require('koa-bodyparser');
const serve = require('koa-static');
const mount = require('koa-mount');
const log = require('koa-logger');
const client = require('pg');

const app = new Koa();
const frontpage = new Koa();
frontpage.use(serve(path.join(__dirname, "../static/build/")));
console.log(path.join(__dirname, "../static/build/"));
app.use(mount(frontpage));

let httpssl = https.createServer(
	{
		key: fs.readFileSync(path.join(__dirname, './.ssl/key.pem'), 'utf8'),
		cert: fs.readFileSync(path.join(__dirname, './.ssl/cert.pem'), 'utf8')
	},
	app.callback()
);


app.use( parser() );
app.use( cors() );
app.use( log() );

const router = new Router();

router.get("/", async (ctx) => {
	console.log("Get received.");
});

router.post("/query", async (ctx) => {
	const client = new Client({
		user: 'Flamdini',
		host: 'stackpost.crymkd1bcdxk.us-east-1.rds.amazonaws.com',
		database: 'stacks',
		password: '0Mn0mn0m!',
		port: 5432,
		sslmode: require
	});
	client.connect();
	const jstring = JSON.stringify(ctx.request.body);
	const json = JSON.parse(jstring);
	const basetable = queryConstruct(json);
	const qandatable = `CREATE TEMP TABLE MyQuery2 AS (SELECT PostTypeId, CASE WHEN ParentOrChild IS NULL THEN 0 END ParentOrChild, COUNT(*) AS answers FROM MyQuery GROUP BY ParentOrChild, PostTypeId);`;
	const zeroquery = {
		text: `SELECT COUNT(*) FROM MyQuery WHERE Id NOT IN (SELECT ParentOrChild FROM MyQuery WHERE PostTypeId = 2) AND PostTypeId = 1;`,
		rowMode: `array`
	};
	const qandaquery = {
		text: `SELECT answers, COUNT(*) FROM MyQuery2 WHERE PostTypeId = 2 GROUP BY answers ORDER BY answers;`,
		rowMode: `array`
	};
	const viewquery = {
		text: `SELECT ViewCount, COUNT(*) FROM MyQuery WHERE ViewCount IS NOT NULL GROUP BY ViewCount ORDER BY ViewCount;`,
		rowMode: `array`
	};
	const unansquery = {
		text: `SELECT year, month, COUNT(*) FROM MyQuery WHERE PostTypeId = 1 AND (Id NOT IN (SELECT ParentOrChild FROM MyQuery WHERE PostTypeId = 2 AND Score > 0) AND ParentOrChild IS NULL) GROUP BY year, month ORDER BY year, month;`,
		rowMode: `array`
	};
	const astotquery = {
		text: `SELECT COUNT(*) FROM MyQuery WHERE PostTypeId = 1 AND ParentOrChild IS NOT NULL;`,
		rowMode: `array`
	};
	const totalquery = {
		text: `SELECT PostTypeId, COUNT(PostTypeId) FROM MyQuery GROUP BY PostTypeId ORDER BY PostTypeId;`,
		rowMode: `array`
	};
	const scorequery = {
		text: `SELECT Score, COUNT(*) FROM MyQuery GROUP BY Score ORDER BY Score;`,
		rowMode: `array`
	};
	const datequery = {
		text: `SELECT year, month, COUNT(*) FROM MyQuery GROUP BY year, month ORDER BY year, month;`,
		rowMode: `array`
	};
	console.log("Forming temporary table.");
	console.log(basetable);
	await client.query(basetable);
	console.log("Temporary table formed.");
	const res = [];
	if(json.advsearch == true){
		await client.query(qandatable);
		res.push(await client.query(zeroquery));
		res.push(await client.query(qandaquery));
		res.push(await client.query(viewquery));
		res.push(await client.query(unansquery));
		res.push(await client.query(astotquery));
	}
	res.push(await client.query(totalquery));
	res.push(await client.query(scorequery));
	res.push(await client.query(datequery));
	console.log(res);
	ctx.body = res;
});

app.use( router.routes() );
//app.listen(3000);
httpssl.listen(443, err => {if (err) console.log(err); });
console.log("Server is listening.");

function queryConstruct(json){

	const viewsmin = parseInt(json.viewsmin) || "-2147483647";
	const viewsmax = parseInt(json.viewsmax) || "2147483647";
	const scoremin = parseInt(json.scoremin) || "-2147483647";
	const scoremax = parseInt(json.scoremax) || "2147483647";
	const datemin = json.datemin == "" ? "2008-01-01T00:00:00" : json.datemin;
	const datemax = json.datemax == "" ? "2022-03-31T23:59:59" : json.datemax;

	const table = json.table;

	const qastring = checkInjector(json, table);
	const viewstring = viewgroupInjector();

	const titlestring = (json.title != "") ? fieldInjector(json.title.split(" "), "Title", json.includequestion, json.includeanswer) : "";
	const bodystring = (json.body != "") ? fieldInjector(json.body.split(" "), "Body", json.includequestion, json.includeanswer) : "";
	const tagstring = (json.tags != "") ? fieldInjector(json.tags.split(" "), "Tags", json.includequestion, json.includeanswer) : "";

	let querystring = `CREATE TEMP TABLE MyQuery AS ` + 
						`SELECT PostTypeId, ` +
							`EXTRACT(YEAR FROM CreationDate) AS year, ` +
							`EXTRACT(MONTH FROM CreationDate) AS month, ` +
							`Id, ` +
							`ParentOrChild, ` +
							`Score, ` +
							`${viewstring} ` +
						`FROM ${table} ` +
						`WHERE ${qastring}` +
							`(CreationDate BETWEEN '${datemin}' AND '${datemax}') ` +
							`AND (Score BETWEEN ${scoremin} AND ${scoremax}) ` +
							`AND ((PostTypeId = 2) OR (ViewCount BETWEEN ${viewsmin} ` +
							`AND ${viewsmax}))` +
							`${titlestring}` +
							`${bodystring}` +
							`${tagstring};`;
	return querystring;
}



function checkInjector(json, table){
	let outstring = ``;
	if(json.includequestion == true || json.includequestion == json.includeanswer){
		if(json.includequestion != json.includeanswer){
			outstring = `(PostTypeId = 1) `;
		}
		outstring += outstring == `` ? `` : `AND `;
		if(json.includesatisfied != json.includeunsatisfied){
			outstring += `(ParentOrChild IS ` + (json.includesatisfied ? `NOT ` : ``) + `NULL) `;
		}
		outstring += outstring == `` ? `` : `AND `;
	}
	else{
		outstring = `(PostTypeId = 2) `;
		if(json.includeaccepted != json.includeother){
			outstring += `AND (ParentOrChild ` + (json.includeaccepted ? `` :  `NOT `);
			outstring += `IN (SELECT ParentOrChild From ${table} WHERE PostTypeId = 1)) `;
		}
		outstring += `AND `;
	}
	return outstring;
}

function fieldInjector(textarray, field, boolq, boola){
	let outstring;
	if((textarray[0] == "") || ((field == "Title" || field == "Tags") && boolq == false)){
		outstring = ``;
	}
	else{
		outstring = " AND ("
		for(let i = 0; i < textarray.length; i++){
			if(field == "Tags"){
				outstring += `(${field} LIKE '%<${textarray[i]}>%')`;
			}
			else{
				outstring += `(${field} LIKE '% ${textarray[i]} %')`;
			}
			if(i+1 != textarray.length){
				outstring += ` AND `;
			}
		}
		outstring += `)`;
	}
	return outstring;
};

function viewgroupInjector(){
	const outstring = `CASE WHEN ViewCOUNT IS NULL THEN NULL ` +
				`WHEN ViewCount BETWEEN 0 AND 99 THEN '<100' ` +
				`WHEN ViewCount BETWEEN 100 AND 199 THEN '<200' ` +
				`WHEN ViewCount BETWEEN 200 AND 299 THEN '<300' ` +
				`WHEN ViewCount BETWEEN 300 AND 399 THEN '<400' ` + 
				`WHEN ViewCount BETWEEN 400 AND 499 THEN '<500' ` +
				`WHEN ViewCount BETWEEN 500 AND 599 THEN '<600' ` +
				`WHEN ViewCount BETWEEN 600 AND 699 THEN '<700' ` +
				`WHEN ViewCount BETWEEN 700 AND 799 THEN '<800' ` +
				`WHEN ViewCount BETWEEN 800 AND 899 THEN '<900' ` +
				`WHEN ViewCount BETWEEN 900 AND 999 THEN '<1000' ` +
				`WHEN ViewCount BETWEEN 1000 AND 1999 THEN '<2000' ` +
				`WHEN ViewCount BETWEEN 2000 AND 2999 THEN '<3000' ` +
				`WHEN ViewCount BETWEEN 3000 AND 3999 THEN '<4000' ` +
				`WHEN ViewCount BETWEEN 4000 AND 4999 THEN '<5000' ` +
				`WHEN ViewCount BETWEEN 5000 AND 5999 THEN '<6000' ` +
				`WHEN ViewCount BETWEEN 6000 AND 6999 THEN '<7000' ` +
				`WHEN ViewCount BETWEEN 7000 AND 7999 THEN '<8000' ` +
				`WHEN ViewCount BETWEEN 8000 AND 8999 THEN '<9000' ` +
				`WHEN ViewCount BETWEEN 9000 AND 9999 THEN '<10000' ` +
				`WHEN ViewCount BETWEEN 10000 AND 10999 THEN '<11000' ` +
				`WHEN ViewCount BETWEEN 11000 AND 11999 THEN '<12000' ` +
				`WHEN ViewCount BETWEEN 12000 AND 12999 THEN '<13000' ` +
				`WHEN ViewCount BETWEEN 13000 AND 13999 THEN '<14000' ` +
				`WHEN ViewCount BETWEEN 14000 AND 14999 THEN '<15000' ` +
				`WHEN ViewCount BETWEEN 15000 AND 15999 THEN '<16000' ` +
				`WHEN ViewCount BETWEEN 16000 AND 16999 THEN '<17000' ` +
				`WHEN ViewCount BETWEEN 17000 AND 17999 THEN '<18000' ` +
				`WHEN ViewCount BETWEEN 18000 AND 18999 THEN '<19000' ` +
				`WHEN ViewCount BETWEEN 19000 AND 19999 THEN '<20000' ` +
				`WHEN ViewCount BETWEEN 20000 AND 21999 THEN '<22000' ` +
				`WHEN ViewCount BETWEEN 22000 AND 23999 THEN '<24000' ` +
				`WHEN ViewCount BETWEEN 24000 AND 25999 THEN '<26000' ` +
				`WHEN ViewCount BETWEEN 26000 AND 27999 THEN '<28000' ` +
				`WHEN ViewCount BETWEEN 28000 AND 29999 THEN '<30000' ` +
				`WHEN ViewCount BETWEEN 30000 AND 39999 THEN '<40000' ` +
				`WHEN ViewCount BETWEEN 40000 AND 59999 THEN '<60000' ` +
				`WHEN ViewCount BETWEEN 60000 AND 79999 THEN '<80000' ` +
				`WHEN ViewCount BETWEEN 80000 AND 99999 THEN '<100000' ` +
				`WHEN ViewCount BETWEEN 100000 AND 119999 THEN '<120000' ` +
				`WHEN ViewCount BETWEEN 120000 AND 139999 THEN '<140000' ` +
				`WHEN ViewCount BETWEEN 140000 AND 159999 THEN '<160000' ` +
				`WHEN ViewCount BETWEEN 160000 AND 179999 THEN '<180000' ` +
				`WHEN ViewCount BETWEEN 180000 AND 199999 THEN '<200000' ` +
				`WHEN ViewCount BETWEEN 200000 AND 299999 THEN '<300000' ` +
				`ELSE '>300000' END NewCount`;
	return outstring;
}
