/*
    解析日志
*/
var readline = require('readline');
var fs = require('fs');
var querystring = require('querystring');
var mysql = require('mysql');
var logSrc = 'logs/owl-18.log';
var lineSrc = 'line.data';



//连接数据库
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '5851204',
  database : 'owl'
});


//查询上次读取的行号
function  getLastLine(){
  fs.readFile(lineSrc,function(err,data){
    if(err){
      console.log('读取行号错误' + err);  
    }else{  
      console.log('上次行号是' + data);

    }
  })
}

//查询上次读取的行号
function  setLastLine(num){
  fs.appendFile(lineSrc,num,function(err){
    if(err){
      console.log('写取行号错误' + err);  
    }else{  
      console.log('写入行号成功' + num);
    }
  })
}



fs.exists(lineSrc, function (exists) {
  if(exists){
    //之前执行过
    var lastLine = getLastLine();
     runLog(lastLine+1);
  }else{
    //首次执行
    runLog(1);
  }
});



//跑日志，参数为起始行
function runLog(startNum){
  //读文件
  var rl = readline.createInterface({
      input: fs.createReadStream('logs/owl-18.log',{start: startNum}),
      output: process.stdout,
      terminal: false
  });

  var currentNum = startNum;

  rl.on('line', function(line) {
      currentNum++;
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
               console.log('session');
            });
        }

      }
  });
  
  //跑完后将新行号存入
  rl.on('close', function(line){
    setLastLine(currentNum);
  })
}




