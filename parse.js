/*
    解析日志
*/
var readline = require('readline');
var fs = require('fs');
var querystring = require('querystring');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : '182.254.209.32',
  user     : 'root',
  password : '5851204',
  database : 'owl'
});




var rl = readline.createInterface({
    input: fs.createReadStream('access.log'),
    output: process.stdout,
    terminal: false
});

rl.on('line', function(line) {
    var result=new Array();
    var fields=line.split(" ");
    var dataStr = line.match(/w.gif\?\S+/)[0];
    var data = querystring.parse(dataStr.split('?')[1]);
    connection.query('INSERT INTO `owl`.`session` (`guid`, `action`) VALUES ("'+data.guid+'","'+data.actions+'")', function(err, rows) {
	  console.log(err);
	});
});