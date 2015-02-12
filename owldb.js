/*
  数据服务调用
*/
var mysql = require('mysql');
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var logFile = 'logs/owl-18.log';
var logFlagFile = 'line.data';
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
		var rsActionArr = [];
		for(var i = 0;i<rows.length;i++){
			rsActionArr.push(rows[i].actions);
		}
		var rsActions = rsActionArr.join('!');
		rows[0].actions = rsActions;
		rows.length = 1;
		res.end(JSON.stringify(rows));

	});
}



function getTableData(req,res){
	connection.query('SELECT count(a.id) as actionLength,count(s.id) as sessionLength FROM `actions`a ,`sessions` s where 1=1', function(err, rows) {
	  var obj = getLogStatus();
	  obj.actionLength = rows[0].actionLength;
	  obj.sessionLength = row[0].sessionLength;
	  res.end(JSON.stringify(obj));
	});
}

function getLogStatus(){
	var status = fs.statSync(logFlagFile);
	//上次入库时间
	var lastTime = status.mtime;
	//上次处理到日志的行数
	var logStor = ~~fs.readFileSync(logFlagFile,{encoding:'utf8'});
	//日志总大小
	var logLength = fs.statSync(logFile);
	return {
		lastTime : lastTime,
		logStor : logStor,
		logLength : logLength
	}
}


module.exports = {
	getSessionList : getSessionList,
	getActionByGuid : getActionByGuid,
	getTableData : getTableData
};
