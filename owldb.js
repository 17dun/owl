/*
  数据服务调用
*/
var mysql = require('mysql');
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '5851204',
  database : 'owl'
});

function getSessionList(req,res){
	connection.query('SELECT * from sessions order by `id` desc', function(err, rows) {
	  res.end(JSON.stringify(rows));
	});
}

function getActionByGuid(req,res){
	var querys = querystring.parse(url.parse(req.url).query);
	res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.setHeader("X-Powered-By",' 3.2.1')
    res.setHeader("Content-Type", "application/json;charset=utf-8");
	var guid = querys.guid;
	connection.query('SELECT * from actions WHERE `guid`="'+guid+'"', function(err, rows) {
		res.end(JSON.stringify(rows));
	});
}

module.exports = {
	getSessionList : getSessionList,
	getActionByGuid : getActionByGuid
};
