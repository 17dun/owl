/*
    静态文件服务
*/

var port=9999;
var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");
//创建http服务端
var server=http.createServer(function(request,response){
    var obj= url.parse(request.url);
    response.setHeader("Server","Node/V8");
    var pathname=obj.pathname;
    if(obj.search){
    	console.log(obj.search);
    }
    var realPath = path.join("public", path.normalize(pathname.replace(/\.\./g, "")));
    var pathHandle=function(realPath){
    //用fs.stat方法获取文件
        fs.stat(realPath,function(err,stats){
            if(err){
                response.writeHead(404,"not found",{'Content-Type':'text/plain'});
                response.write("the request "+realPath+" is not found");
                response.end();
            }else{
                if(stats.isDirectory()){
                }else{
                        var raw = fs.createReadStream(realPath);
                        var acceptEncoding = request.headers['accept-encoding'] || "";
                            response.writeHead(200, "Ok");
                            raw.pipe(response);
                }
            }
        });

    }
    pathHandle(realPath);
});
server.listen(port);
var startTime = new Date();
console.log("owl log server start at"+startTime);