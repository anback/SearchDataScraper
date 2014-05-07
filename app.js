var app = function() {
	var path = require('path');
	var request = require('request');
	var fs = require('fs');
	var childProcess = require('child_process');
	var phantomjs = require('phantomjs');
	var MongoClient = require('mongodb').MongoClient;
	var binPath = phantomjs.path;
	var url = 'http://www.momondo.se/multicity/?Search=true&TripType=return&SegNo=2&SO0=STO&SD0=ROM&SDP0=25-06-2014&SO1=ROM&SD1=STO&SDP1=31-07-2014&AD=1&TK=ECO&DO=false&NA=false';
	var mongoUrl = 'mongodb://127.0.0.1:27017/test';
	var childArgs = [path.join(__dirname, 'phantomjs-momondo-scraper.js'), url];

	var url = '';

	console.log("Start Momondo Search ..");
	childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
		console.log("Url for result data obtained ..");
		var splits = stdout.split('\n');
		splits.forEach(function(item, index) {
			if(item.indexOf("http://www.momondo.se/api/3.0/FlightSearch/") != -1)
				url = item;
		});

		var uniqueString = new Date().getTime().toString();

		console.log("Wating for 10 seconds")
		setTimeout(function() {
			console.log("Getting data from: " + url);
			request(url, function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				console.log("Parsing data ..");
			  	var json = JSON.parse(body);

			  	console.log("Connecting to Mongo ..");
				MongoClient.connect(mongoUrl, function(err, db) {
				    if(err) throw err;
				    console.log("Inserting document .. ")
				    var collection = db.collection('test_insert');
				    collection.insert(json, function(err, docs) {
				    	console.log("Finished Inserting");
				    });
				  });
			  }
			});
		}, 10000);
	});
}

app();