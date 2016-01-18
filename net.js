var net = require("net");
var Skyweb = require("skyweb");

var skyweb = new Skyweb();

var username = process.argv[2];
var password = process.argv[3];
if (!username || !password) {
    throw new Error('Username and password should be provided as commandline arguments!');
}

skyweb.login(username, password).then(function(acc)
{
    console.log("Skype is now logged in.");
})

var HOST = "127.0.0.1";
var PORT = "6868";

var timeout = 0;

var client = new net.Socket();

var connect = function() {
	if (timeout > 0) {
		console.log("Trying to connect in " + timeout + " seconds.");
	}

	setTimeout(function() {
		client.connect(PORT, HOST, function() {
			console.log("Connected");
			timeout = 0;
		});
	}, timeout * 1000);
	timeout = (timeout <= 60) ? timeout+10 : timeout;
}

var sendMessage = function(Message) {
	if (Message.length < 2) {
        console.log("The arguments is invalid.")
        console.log('DATA ' + client.remoteAddress + ': ' + Message);
        return;
	}

    skyweb.sendMessage(Message[0], Message[1]);
}

connect();

client.on('error', function() {
	console.log("Can't connect, trying again.");
	connect();
})

client.on("data", function(data) {
	console.log("Received: " + data);
	var dataJson = JSON.parse(data.toString());

	if (dataJson.length < 2) {
		console.log("The data does not have enough arguments.");
		console.log("DATA " + client.remoteAddress + ": " + data);
		return;
	}

	if (dataJson[0] == "sendMessage") {
		for (var i = 0; i < dataJson[1].length; i++) {
			sendMessage(dataJson[1][i]);
		}

	}
});

client.on("close", function() {
	console.log("Connection closed.");
})

skyweb.messagesCallback = function(messages) {
	messages.forEach(function(message) {
		if (message.resource.from.indexOf("tryy3.bot")=== -1 && message.resource.messagetype !== 'Control/Typing' && message.resource.messagetype !== 'Control/ClearTyping') {
			var link = message.resource.conversationLink;
            var id = link.substring(link.lastIndexOf("/") + 1);
            var from = message.resource.from.substring(message.resource.from.lastIndexOf('/') + 1);
            client.write(JSON.stringify(["onMessageEvent", [id, from, message.resource.content]]) + "\n");
		}
	})
};