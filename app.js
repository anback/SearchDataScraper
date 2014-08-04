var mubsub = require('mubsub');
var isdebug = process.argv[2] == 'debug';
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;
var path = require('path');
var childProcess = require('child_process');
var urlPrefix = 'http://www.skyscanner.de/dataservices/routedate/v2.0/';
console.log("IsDebug: " + isdebug);


var getFormattedDate = function(input) {
    input = input.toJSON().split('20')[1];
    input = input.split('T')[0];
    input = input.replace('-','');
    input = input.replace('-','');
    return input;
    
}

var count = 0;



var executeSearch = function(data) {
    count++;
    console.log(count);
    if(count % 3 != 0)
        return;
    var ssUrl = 'http://www.skyscanner.de/transport/fluge/{0}/{1}/{2}/{3}/?usrplace=DE'
    ssUrl = ssUrl.format(data.in_FromCity, data.in_ToCity, getFormattedDate(data.in_DepartureDate), getFormattedDate(data.in_ReturnDate));
    console.log(ssUrl);
    childProcess.execFile(binPath, [path.join(__dirname, 'ssScraper.js'), ssUrl], function(err, stdout, stderr) {

        if(stdout.split(urlPrefix).length <= 1)
            return;

        var url = urlPrefix + stdout.split(urlPrefix)[1].split('?')[0];
        console.log('publishing url: ' +  url);
        urlChannel.publish('newUrl', url);
    });
}

var client = mubsub('mongodb://swalo:84kAanan@ds051658.mongolab.com:51658/swalo');
var searchChannel = client.channel('searches');
var urlChannel = client.channel('urls');

client.on('error', console.error);
searchChannel.on('error', console.error);


searchChannel.subscribe('NewSearch', function (message) {
    if(!isdebug || count == 0)
        executeSearch(message);
    count = count + 1;
});

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}