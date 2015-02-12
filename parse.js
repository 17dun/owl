/*
    解析日志
*/
var readline = require('readline');
var fs = require('fs');
var querystring = require('querystring');
var mysql = require('mysql');

var logFile = 'logs/owl-18.log';
var logSizeFile = 'size.data';
var logLineFile = 'line.data';


//连接数据库
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '5851204',
  database : 'owl'
});


//查询上次读取的行号
function  getLastLine(){
  return ~~fs.readFileSync(logLineFile,{encoding:'utf8'});
}

//设置本次处理到的行号
function  setLastLine(num){
  fs.writeFile(logLineFile,num,function(err){
    if(err){
      console.log('写入行号错误' + err);  
    }else{  
      console.log('处理到第' + num + '条日志');
    }
  })
}

//设置本次处理日志的大小
function  setLastSize(num){
  fs.writeFile(logSizeFile,num,function(err){
    if(err){
      console.log('写入size错误' + err);  
    }
  })
}




fs.exists(logLineFile, function (exists) {
  if(exists){
    //之前执行过
    var lastLine = getLastLine();
	   runLog(lastLine);
  }else{
    //首次执行
    runLog(0);
  }
});

//跑日志，参数为起始行
function runLog(lastLine){
  //读文件
	var rl = readline.createInterface({
		input: fs.createReadStream(logFile),
		output: process.stdout,
		terminal: false
	});
  var currentNum = 1;
	rl.on('line', function(line) {
		//之前没有跑过的数据才入库
		if(currentNum>lastLine){
	  		if(line.indexOf('dataType')==-1){

	      	}else{
		        var dataStr = line.match(/\?sid=\S+/)[0];
		        var data = querystring.parse(dataStr.split('?')[1]);
		        //session数据
		        if(data.actions){
		            connection.query('INSERT INTO `owl`.`actions` (`guid`, `actions`) VALUES ("'+data.guid+'","'+data.actions+'")', function(err, rows) {
		               console.log('actions')
		            });
		        }else{
		            connection.query('INSERT INTO `owl`.`sessions` (`guid`,`time`,`sid`,`logid`, `query`, `baiduid`,`format`, `pn`,`rn`, `net`,`availHeight`, `availWidth`,`platform`) VALUES ("'+data.guid+'","'+data.startTime+'","'+data.sid+'","'+data.logid+'","'+data.query+'","'+data.Baiduid+'","'+data.format+'","'+data.pn+'","'+data.rn+'","'+data.net+'","'+data.availHeight+'","'+data.availWidth+'","'+data.platform+'")', function(err, rows) {
		               console.log(data.logid);
		            });
		        }
	      }
	  }
      currentNum++;
  });
  
  //跑完后将新行号存入
  rl.on('close', function(line){
    setLastLine(currentNum-1);
    var logsize = fs.statSync(logFile).size;
    setLastSize(logsize);
  })
}




