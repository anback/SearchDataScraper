var exec = require('child_process').exec;
var skyscannerScraperCommand = 'java -jar ' + require('path').join(__dirname, 'SSScraper.jar ');
var mubsub = require('mubsub');

var getFormattedDate = function(input) {
    input = input.toJSON().split('T')[0];
    var parts = input.split('-');
    var date = new Date(parts[0], parts[1]-1, parts[2]); // Note: months are 0-based
    return date.getDate() + '.' + (parseInt(date.getMonth()) + 1) + '.' + date.getFullYear();
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
    var args=[data.in_FromCity, data.in_ToCity, getFormattedDate(data.in_DepartureDate), getFormattedDate(data.in_ReturnDate)];
    console.log(skyscannerScraperCommand + args.join(' '));
    exec(skyscannerScraperCommand + args.join(' '), function callback(error, stdout, stderr){
        console.log(error);
        console.log(stdout);
        console.log(stderr);
    });
}

var client = mubsub('mongodb://swalo:84kAanan@ds051658.mongolab.com:51658/swalo');
var channel = client.channel('searches');

client.on('error', console.error);
channel.on('error', console.error);

channel.subscribe('NewSearch', function (message) {
    executeSearch(message);
});