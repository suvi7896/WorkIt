var config = require('./config.js');
var flock = require('flockos');
var express = require('express');
var store = require('./store.js');
var chrono = require('chrono-node');
var Mustache = require('mustache');
var fs = require('fs');
var util = require('util');


flock.appId = config.appId;
flock.appSecret = config.appSecret;

var app = express();
app.use(flock.events.tokenVerifier);
app.post('/events', flock.events.listener);
app.use(express.static('public'))


app.listen(8080, function () {
    console.log('Listening on 8080');
});

// install tokens
flock.events.on('app.install', function (event, callback) {
    store.saveToken(event.userId, event.token);
    callback();
});

flock.events.on('client.slashCommand', function (event, callback) {
    var r = event.text;
    var i = 0
    for (i = 0; i <= r.length - 1;  i++) {
        var c = r.charAt(i);
        if (c == ' ') {
            break;
        }
        
    }
    
    var t = r.substr(0,i);
    i++;
    var j =i;
    for (; j <= r.length - 1;  j++) {
        var c = r.charAt(j);
        if (c == ' ') {
            break;
        }
        
    }
    var cat = r.substr(i,j-i);
    j++;
    var i = r.substr(j,r.length);
    console.log('parse result', r);
    if (r) {
        var idea = {
            userId: event.userId,
            title: t,
            category: cat,
            description: i
        };
        console.log('adding idea', idea);
        addAlarm(idea);
        callback(null, { text: 'idea added' });
    } else {
        callback(null, { text: 'idea content not specified' });
    }
});

/*

flock.events.on('client.slashCommand', function(event,callback) {
    var info = event.text;
    if (info) {
        var alarm = {
            userId: event.userId,
            text: event.text,
            title: '',
            category: 0
        }; 
        console.log('adding idea', alarm);
        addAlarm(alarm);
        callback(null, {text: 'Idea added to WorkIt'});
    } else {
        callback(null, {text: 'Idea structure not specified'});
    }
});

*/

var addAlarm = function (alarm) {
    store.addAlarm(alarm);
    scheduleAlarm(alarm);
};

var scheduleAlarm = function (alarm) {
        store.removeAlarm(alarm)
};

// schedule all ideas saved in db
store.allAlarms().forEach(scheduleAlarm);

var sendAlarm = function (alarm) {
    flock.chat.sendMessage(config.botToken, {
        to: alarm.userId,
        text: alarm.text
    });
};

var listTemplate = fs.readFileSync('index.html', 'utf8');
app.get('/list', function (req, res) {
    var event = JSON.parse(req.query.flockEvent);
    var alarms = store.userAlarms(event.userId).map(function (alarm) {
        return {
            text: alarm.text,
            by: alarm.userId
        }
    });
    res.set('Content-Type', 'text/html');
    var body = Mustache.render(listTemplate, { alarms: alarms });
    res.send(body);
});

flock.events.on('client.messageAction', function (event, callback) {
    var messages = event.messages;
    if (!(messages && messages.length > 0)) {
        console.log('chat', event.chat);
        console.log('uids', event.messageUids);
        console.log('token', store.getToken(event.userId));
        flock.chat.fetchMessages(store.getToken(event.userId), {
            chat: event.chat,
            uids: event.messageUids
        }, function (error, messages) {
            if (error) {
                console.warn('Got error');
                callback(error);
            } else {
                setAlarms(messages);
            }
        });
    } else {
        setAlarms(messages);
    }
    var setAlarms = function (messages) {
        var alarms = messages.map(function (message) {
            var parsed = message.text;
            if (parsed) {
                return {
                    userId: event.userId,
                    text: message.text
                }
            } else {
                return null;
            }
        }).filter(function (alarm) {
            return alarm !== null;
        });
        if (alarms.length > 0) {
            alarms.forEach(addAlarm);
            callback(null, { text: util.format('%d idea(s) added', alarms.length) });
        } else {
            callback(null, { text: 'No ideas found' });
        }
    };
});