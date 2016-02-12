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

            client.write({
                "Name": "Node Skype",
                "Type": "Skype",
                "VersionStandard": "0.0.1",
                "VersionListener": "0.0.1"
            });

            timeout = 0;
      });
    }, timeout * 1000);
    timeout = (timeout <= 60) ? timeout+10 : timeout;
}
var sendMessages = function(data) {
    if (!Array.isArray(data)) sendMessage(data);

    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            continue;
        }
        sendMessage(data[key]);
    }
}

var sendMessage = function(data) {
    if (!(data instanceof Object)) {
        console.log("The data is not a object.")
        console.log("DATA " + client.remoteAddress + ": " + data);
        return;
    }

    data.message = data.message.replace(new RegExp("(&[0-9|a-f])|({(dark_)?(bl(ue|ack)|gr(ay|een)|aqua|red|purple|yellow|gold|white)})", 'g'), "");

    skyweb.sendMessage(data.channel, data.message);
}

connect();

client.on('error', function() {
    console.log("Can't connect, trying again.");
    connect();
})

client.on("data", function(data) {
    console.log("Received: " + data);
    var dataJson = JSON.parse(data.toString());

    if (!(dataJson instanceof Object)) {
        console.log("The data is not a object.");
        console.log("DATA " + client.remoteAddress + ": " + dataJson);
        return;
    }

    if (dataJson.type == "sendMessage") {
        sendMessages(dataJson.data);
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
            client.write(JSON.stringify({
                "type": "onMessageEvent",
                "data": {
                    "id" : id,
                    "from" : from,
                    "message" : message.resource.content
                }}) + "\n");
        }
    })
};
