//var exec = require('child_process').exec;
//var skyscannerScraperCommand = 'java -jar ' + require('path').join(__dirname, 'SSScraper.jar ');
var mubsub = require('mubsub');
var isdebug = process.argv[2] == 'debug';
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;
var path = require('path');
var childProcess = require('child_process');
console.log("IsDebug: " + isdebug);


var getFormattedDate = function(input) {
    input = input.toJSON().split('20')[1];
    input = input.split('T')[0];
    input = input.replace('-','');
    input = input.replace('-','');
    return input;
    
}

var executeSearch = function(data) {

    if(data.in_FromCity == undefined)
        return
    if(data.in_ToCity == undefined)
        return
    if(data.in_DepartureDate == undefined)
        return
    if(data.in_ReturnDate == undefined)
        return

    //Write some code that executes the runnable jar file
    //var args=[data.in_FromCity, data.in_ToCity, getFormattedDate(data.in_DepartureDate), getFormattedDate(data.in_ReturnDate)];
    var ssUrl = 'http://www.skyscanner.de/transport/fluge/{0}/{1}/{2}/{3}/?usrplace=DE'
    ssUrl = ssUrl.format(data.in_FromCity, data.in_ToCity, getFormattedDate(data.in_DepartureDate), getFormattedDate(data.in_ReturnDate));
    console.log(ssUrl);
    /*
    console.log(skyscannerScraperCommand + args.join(' '));
    exec(skyscannerScraperCommand + args.join(' '), function callback(error, stdout, stderr){

    });*/

    //console.log(path.join(__dirname, 'ssScraper.js'));
    childProcess.execFile(binPath, [path.join(__dirname, 'ssScraper.js'), ssUrl], function(err, stdout, stderr) {
        console.log("hej");
        console.log(err);
        console.log(stdout);
        console.log(stderr);
    });
}

var client = mubsub('mongodb://swalo:84kAanan@ds051658.mongolab.com:51658/swalo');
var channel = client.channel('searches');

client.on('error', console.error);
channel.on('error', console.error);

var count = 0;
channel.subscribe('NewSearch', function (message) {

    //if(!isdebug || count == 0)
        executeSearch(message);
    //count++;
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