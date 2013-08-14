//load express module
var express = require('express'),
	`1
	server = require('http').createServer(app),
	io = require('socket.io').listen(server, {log: false }),
	chatUsers = {};

server.listen(3000);

//send page in response to root request
app.get('/', function(req, res){
	res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){
	//receive login attempt
	socket.on('tryLogon', function(data, callback){
		if (data in chatUsers) {
			//login already exists
			callback(false);
		} else{
			callback(true);
			socket.user = data;
			chatUsers[socket.user] = socket;
			updateUsers();
		}
	});

	//send out user list
	function updateUsers(){
			io.sockets.emit('userList', Object.keys(chatUsers));
	}

	//receive & emit new message
	socket.on('msgToServer', function(data, callback){
		//console.log(data);
		if (data.charAt(0) === '>'){
			//msg is a PM
			var i = data.indexOf(' ');
			var pmUserName = data.substring(1, i)
			var msg = data.substring(i).trim();

			//console.log(i);
			//console.log(pmUserName);
			//console.log(msg);

			if(pmUserName in chatUsers){
				chatUsers[pmUserName].emit('privateMsgFromServer', {msg: msg, user: socket.user});
			} else {
				callback(pmUserName + 'is not a member of this chat room!');
			}
		} else{
			//global msg
			io.sockets.emit('msgFromServer', {msg: data, user: socket.user});
		}
	});

	//remove user from userlist on disconnect
	socket.on('disconnect', function(data){
		if (!socket.user) return;
		chatUsers.splice(chatUsers.indexOf(socket.user), 1);
		updateUsers();
	});
});