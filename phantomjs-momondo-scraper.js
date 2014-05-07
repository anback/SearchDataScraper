var page = require('webpage').create();
var args = require('system').args;
var url = args[1];


page.onResourceRequested = function(request) {
	if(request.url.indexOf("http://www.momondo.se/api/3.0/FlightSearch/") != -1)
	{
  		console.log(request.url);
  		phantom.exit();
	}
};
page.open(url);

/*
page.onResourceReceived = function(response) {
	if(response.url.indexOf("FlightSearch") != -1)
  		console.log('************** Receive ' + response.url);
};


*/
/*
setTimeout(function() {
	var uniqueString = new Date().getTime().toString()
	page.render('test' + uniqueString + '.png');
	phantom.exit();
}, 10000);
*/