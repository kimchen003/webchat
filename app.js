var express = require("express");
var app = express();
var server = require('http').Server(app);
var io = require("socket.io")(server);
var fs = require('fs');

var recode = function (change,cb){
    fs.readFile('data/data.json',function(err,data){
        if(err)throw err;

        var json = JSON.parse(data.toString());
        json.allcount = Math.max( parseInt(json.allcount) + parseInt(change || 0) , 0 );

        fs.writeFile('data/data.json',JSON.stringify(json));

        cb&&cb(json);
    });
}

var user = [];

io.on("connection",function(socket){

    user.push(socket);

    //请求响应处理
    socket.on("send name",function(data){

        var newUser = {
            name : data.name,
            id : new Date().getTime()
        };

        broadcast("send name",newUser);

        socket.dataName = data.name;

        console.log(socket.dataName,",连接");

        broadcast("update allcount",{
            allcount : user.length
        })
    });

    socket.on("send message",function(data){
        broadcast("send message",{
            message : data.message,
            username : socket.dataName
        });
    });

    //断开连接
    socket.on("disconnect",function(){
        console.log(socket.dataName,",断开");

        for(var i=0;i<user.length;i++){
            if(user[i].id == socket.id){
                user.splice(i,1);
            }
        }

        broadcast("update allcount",{
            allcount : user.length
        })

    });
});

//广播
var broadcast = function(event,data){
    for(var i=0;i<user.length;i++){
        user[i].emit(event,data);
    }
};

app.use(express.static("lib"));

app.get("/",function(req,res){
    res.sendFile(__dirname+"/index.html");
});

server.listen(2330);