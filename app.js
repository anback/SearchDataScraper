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
    
    /*
    count++;
    console.log(count);
    if(count % 3 != 0)
        return;
    */
    var ssUrl = 'http://www.skyscanner.de/transport/fluge/{0}/{1}/{2}/{3}/?usrplace=DE'
    ssUrl = ssUrl.format(data.in_FromCity, data.in_ToCity, getFormattedDate(data.in_DepartureDate), getFormattedDate(data.in_ReturnDate));
    console.log(ssUrl);
    childProcess.execFile(binPath, [path.join(__dirname, 'ssScraper.js'), ssUrl], function(err, stdout, stderr) {
        var res = parseSSHTML(stdout);
        
    });
}

var client = mubsub('mongodb://swalo:84kAanan@ds051658.mongolab.com:51658/swalo');
var searchChannel = client.channel('searches');
var searchdata = client.channel('searchdata');

client.on('error', console.error);
searchChannel.on('error', console.error);


searchChannel.subscribe('NewSearch', function (message) {
    if(!isdebug || count == 0)
        executeSearch(message);
    count = count + 1;
});

var parseAndSendSSHTML = function(html) {
    var env = require('jsdom').env;
    console.log(html);
    // first argument can be html string, filename, or url
    var res = {};
    env(html, function (errors, window) {
        var $ = require('jquery')(window);
        console.log("best price: ");
        console.log($('.header-info-bestprice').text());

        res.BestPrice = $('.header-info-bestprice .price').text();
        res.Itineraries = $('.day-list-item').map(function(item) {
            $this = $(this);
            var res = {};

            res.CarrierIds = $('.carrier-wrapper img', $this).attr('data-carrier-ids');
            res.OutboundLegDepartureTime = $('.leg.depart.flight .leg-flight-depart .leg-flight-time', $this).text();
            res.InboundLegDepartureTime = $('.leg.return.flight .leg-flight-return .leg-flight-time', $this).text();
            res.Origin = $('.leg.depart.flight .leg-flight-depart .leg-flight-station', $this).text();
            res.Dest = $('.leg.return.flight .leg-flight-depart .leg-flight-station', $this).text();
            res.prices = [];

            res.prices = $('.details-group-altquotes-wrapper li a', $this).map(function() {
                $that = $(this);
                return {
                    Price : $that.text().trim().split(' ')[1],
                    OTA: $that.text().trim().split(' ')[0]
                }
            });

            res.prices = $.makeArray( res.prices );

            res.prices.unshift({
                Price : $('.mainquote-wrapper a.mainquote-price', $this).text(),
                OTA : $('.mainquote-wrapper a.mainquote-agent', $this).text(),
            });

            return res;
        });
        res.Itineraries = $.makeArray( res.Itineraries );
        console.log("Publishing Result!");
        urlChannel.publish('NewRes', res);
    });
    //console.log(res);
    return res;
}


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
