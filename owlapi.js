var http = require('http');
var url = require('url');
var db = require('./owldb');
var parseTask = require('./parse')
var querystring = require('querystring');
var port = 9998;
function main(req,res){
  var arg  = url.parse(req.url).query;
  var method = querystring.parse(arg).method;
  if(db[method]){
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.setHeader("X-Powered-By",' 3.2.1')
    res.setHeader("Content-Type", "application/json;charset=utf-8");
    db[method](req,res);
  }else if(method=='runTask'){
    parseTask.run();
    var rs = {
      code : 0,
      msg : '成功'
    }
    res.end(JSON.stringify(rs));
  }else{
    res.write('method not find!');
    res.end();
  }
}
function start(){
  http.createServer(main).listen(port);
  console.log('owl数据接口启动，端口:'+port);
}
start();