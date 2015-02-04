var http = require('http');
var url = require('url');
var db = require('./apidb');
var querystring = require('querystring');
var port = 9998;
function main(req,res){
  var arg  = url.parse(req.url).query;
  var method = querystring.parse(arg).method;
  if(db[method]){
    db[method](req,res);
  }else{
    res.write('方法不存在');
    res.end();
  }
}
function start(){
  http.createServer(main).listen(port);
  console.log('owl数据接口启动，端口:'+port);
}
start();