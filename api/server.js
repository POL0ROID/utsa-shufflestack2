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

const app = new Koa();
const frontpage = new Koa();
frontpage.use(serve(path.join(__dirname, "/static/build/")));
app.use(mount(frontpage));

let httpssl = https.createServer(
	{
		key: fs.readFileSync(path.join(__dirname, './.ssl/key.pem'), 'utf8'),
		cert: fs.readFileSync(path.join(__dirname, './.ssl/cert.pem'), 'utf8')
	},
	app.callback()
);

console.log("Server is listening.");

app.use( parser() );
app.use( cors() );
app.use( log() );

const router = new Router();
router.post("/query", async (ctx, next) => {
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
	const basetable= queryconstruct(json);
	const qandatable = "CREATE TEMP TABLE MyQuery2 AS SELECT PostTypeId, ParentOrChild, COUNT(*) FROM MyQuery GROUP BY PostTypeId, ParentOrChild;";
	const qandaquery = `SELECT * FROM MyQuery2;`
	const totalquery = "SELECT PostTypeId, COUNT(*) FROM MyQuery2 GROUP BY PostTypeId;";
	const viewquery = "SELECT ViewCount, COUNT(*) FROM MyQuery GROUP BY ViewCount;";
	const scorequery = "SELECT Score, COUNT(*) FROM MyQuery GROUP BY Score;";
	const datequery = "SELECT year, month, COUNT(*) FROM MyQuery GROUP BY year, month;";
	console.log("Timed out?");
	const [r1, r2, r3, r4, r5, r6] = await Promise.all([
		client.query(basetable),
		client.query(qandatable),
		client.query(qandaquery),
		client.query(totalquery),
		client.query(viewquery),
		client.query(scorequery),
		client.query(datequery)
	]);
	console.log("Timed out?");
	console.log(r3, r4, r5, r6);
	app.use(async ctx => {
			res.header('Access-Control-Allow-Origin', '*');
			ctx.body = [r3, r4, r5, r6];
	});
});

router.get("/query", async (ctx, next) => {
	console.log("Get received.");
});

app.use( router.routes() );

function queryconstruct(json){

	const viewsmin = parseInt(json.viewsmin) || null;
	const viewsmax = parseInt(json.viewsmax) || null;
	const scoremin = parseInt(json.scoremin) || null;
	const scoremax = parseInt(json.scoremax) || null;
	const datemin = json.datemin == "" ? null : json.datemin;
	const datemax = json.datemax == "" ? null : json.datemax;

	const titlestring = (json.title != "") ? fieldInjector(json.title.split(" "), "Title", json.includequestion, json.includeanswer) : "";
	const bodystring = (json.body != "") ? fieldInjector(json.body.split(" "), "Body", json.includequestion, json.includeanswer) : "";
	const tagstring = (json.tags != "") ? fieldInjector(json.tags.split(" "), "Tags", json.includequestion, json.includeanswer) : "";
	const viewstring = rangeInjector(json.includequestion, json.includeanswer, viewsmin, viewsmax);
	const qstring = checkInjector(json.includequestion, json.includesatisfied, json.includeunsatisfied, 1);
	const astring = checkInjector(json.includeanswer, json.includeaccepted, json.includeother, 2);

	let querystring = `CREATE TEMP TABLE MyQuery AS ` + 
						`SELECT PostTypeId, ` +
								`EXTRACT(YEAR FROM CreationDate) AS year, ` +
								`EXTRACT(MONTH FROM CreationDate) AS month, ` +
								`Id, ` +
								`ParentOrChild, ` +
								`Score, ` +
								`ViewCount ` +
						`FROM ${json.table} ` +
						`WHERE (${qstring} OR ${astring}) ` +
							`AND ((CreationDate BETWEEN ${datemin} AND ${datemax}) ` +
												`OR (${datemin} IS NULL AND ${datemax} IS NULL) ` +
												`OR (${datemin} IS NULL AND ${datemax} >= CreationDate) ` +
												`OR (${datemax} IS NULL AND ${datemin} <= CreationDate)) ` +
							`AND ((Score BETWEEN ${scoremin} AND ${scoremax}) ` +
										`OR (${scoremin} IS NULL AND ${scoremax} IS NULL) ` +
										`OR (${scoremin} IS NULL AND ${scoremax} >= Score) ` +
										`OR (${scoremax} IS NULL AND ${scoremin} <= Score))` +
							`${titlestring}` +
							`${bodystring}` +
							`${tagstring}` +
							`${viewstring};`;
	return querystring;
}



function checkInjector(bool1, bool2, bool3, type){
	let outstring = `PostTypeId = ${type}`;
	if (bool1 == true){
		if (bool2 == true){
			if (bool3 == false){
				outstring += " AND ParentOrChild IS NOT NULL";
			}
		}
		else{
			if (bool3 == true){
				outstring += " AND ParentOrChild IS NULL";
			}
		}
	}
	return outstring;
}

function rangeInjector(boolq, boola, min, max){
	let outstring = "";
	if (boolq == true){
		outstring += ` AND ( ` +
			`((ViewCount BETWEEN ${min} AND ${max}) ` +
						`OR (${min} IS NULL AND ${max} IS NULL)) ` +
						`OR (${min} IS NULL AND ${max} >= ViewCount) ` +
						`OR (${max} IS NULL AND ${min} <= ViewCount))`;
		if (boola == true){
			outstring += " OR (ViewCount IS NULL)";
		}
	}
	return outstring;
}

function fieldInjector(textarray, field, boolq, boola){
	let outstring;
	if ((textarray[0] == "") || ((field == "Title" || field == "Tags") && boolq == false && boola == true)){
		outstring = ""
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
			if (i+1 != textarray.length){
				outstring += " AND ";
			}
		}
		outstring += ") ";
	}
	return outstring;
};
//app.listen(3000);
//app.listen(443, err => {if (err) console.log(err);});
httpssl.listen(443, err => {if (err) console.log(err); });
