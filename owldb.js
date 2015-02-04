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
	
	var guid = querys.guid;
	connection.query('SELECT s.time , a.* from `sessions` as s inner join `actions` as a on a.guid=s.guid WHERE a.guid="'+guid+'"', function(err, rows) {
		res.end(JSON.stringify(rows));
	});
}

module.exports = {
	getSessionList : getSessionList,
	getActionByGuid : getActionByGuid
};
