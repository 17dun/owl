/*
    解析日志
*/
var readline = require('readline');
var fs = require('fs');
var querystring = require('querystring');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '5851204',
  database : 'owl'
});

var rl = readline.createInterface({
    input: fs.createReadStream('logs/owl-18.log'),
    output: process.stdout,
    terminal: false
});

rl.on('line', function(line) {
    var result=new Array();
    if(line.indexOf('dataType')==-1){
	     console.log('hule')
    }else{
      var dataStr = line.match(/\?sid=\S+/)[0];
      var data = querystring.parse(dataStr.split('?')[1]);

      //session数据
      if(data.actions){
          connection.query('INSERT INTO `owl`.`actions` (`guid`, `actions`) VALUES ("'+data.guid+'","'+data.actions+'")', function(err, rows) {
             console.log('actions')
          });
      }else{
          connection.query('INSERT INTO `owl`.`sessions` (`guid`, `sid`,`logid`, `query`, `baiduid`,`format`, `pn`,`rn`, `net`,`availHeight`, `availWidth`,`platform`) VALUES ("'+data.guid+'","'+data.sid+'","'+data.logid+'","'+data.query+'","'+data.baiduid+'","'+data.format+'","'+data.pn+'","'+data.rn+'","'+data.net+'","'+data.availHeight+'","'+data.availWidth+'","'+data.platform+'")', function(err, rows) {
             console.log('ok');
          });
      }

    }
    

});
