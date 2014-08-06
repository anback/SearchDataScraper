var mubsub = require('mubsub');
var isdebug = process.argv[2] == 'debug';
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;
var path = require('path');
var childProcess = require('child_process');
var urlPrefix = 'http://www.skyscanner.de/dataservices/routedate/v2.0/';
var request = require('request');
console.log("IsDebug: " + isdebug);


var getFormattedDate = function(input) {
    input = input.toJSON().split('20')[1];
    input = input.split('T')[0];
    input = input.replace('-','');
    input = input.replace('-','');
    return input;
    
}

var count = 0;

var processcount = 0;

var executeSearch = function(data) {
    
    /*
    count++;
    console.log(count);
    if(count % 3 == 0)
        return;
    */
    var ssUrl = 'http://www.skyscanner.de/transport/fluge/{0}/{1}/{2}/{3}/?usrplace=DE'
    ssUrl = ssUrl.format(data.in_FromCity, data.in_ToCity, getFormattedDate(data.in_DepartureDate), getFormattedDate(data.in_ReturnDate));
    console.log(ssUrl);

    /*
    var phantomjsCloudurl = 'http://api.phantomjscloud.com/single/browser/v1/cc4d4fb2d18599197a5a87c8d42de349c5b87f22';

    var body = JSON.stringify({
      "targetUrl": ssUrl,
      "requestType": "text",
      "outputAsJson": true,
      "loadImages": false,
      "isDebug": false,
      "timeout": 15000,
      "postDomLoadedTimeout": 5000,
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36",
      "resourceUrlBlacklist": []});

    console.log(body);
    var options = {
        method : 'POST',
        body : body
    }

    
    request(phantomjsCloudurl, options, function(err, res, body) {
        console.log(err);
        //console.log(res);
        console.log(body);
    });
*/

    
    console.log("Processcount: " + processcount);
    if(processcount < 30)
    {
        processcount++;
        var process = childProcess.execFile(binPath, [path.join(__dirname, 'ssScraper.js'), ssUrl], function(err, stdout, stderr) {
            parseAndSendSSHTML(stdout);
        });

        process.on('exit', function() {
            
            processcount--
        });
    }
}

var client = mubsub('mongodb://swalo:84kAanan@ds051658.mongolab.com:51658/swalo');
var searchChannel = client.channel('searches');
var searchdataChannel = client.channel('searchdata');

client.on('error', console.error);
searchChannel.on('error', console.error);


searchChannel.subscribe('NewSearch', function (message) {
    if(!isdebug || count == 0)
        executeSearch(message);
    count = count + 1;
});

var parsePriceHTML = function($element) {
    
    var text = $element.text().trim();
    if(text.indexOf('€') == -1)
        return undefined;

    var splits = text.split(' ');

    if(splits.length > 3) //Aegan Airlines 54 €
        return {
            Price : splits[0] + ' ' + splits[1],
            OTA: splits[2]
        }

    return {
        Price : splits[1],
        OTA: splits[0]
    }
}

var parseAndSendSSHTML = function(html) {
    var env = require('jsdom').env;
    // first argument can be html string, filename, or url
    var res = {};
    env(html, function (errors, window) {
        var $ = require('jquery')(window);
        //console.log($('.header-info-bestprice').text());

        res.BestPrice = $('.header-info-bestprice .price').text();
        res.Itineraries = $('.day-list-item').map(function(item) {
            $this = $(this);
            var res = {};

            res.CarrierIds = $('.carrier-wrapper img, .carrier-wrapper span', $this).attr('data-carrier-ids');
            res.OutboundLegDepartureDateTime = $("div.day-options-item.depart > div > div.day-options-navigation > span").attr('data-date') + ' ' + $('.leg.depart.flight .leg-flight-depart .leg-flight-time', $this).text();
            res.InboundLegDepartureDateTime = $("div.day-options-item.return > div > div.day-options-navigation > span").attr('data-date') + ' ' + $('.leg.return.flight .leg-flight-depart .leg-flight-time', $this).text();
            res.Origin = $('.leg.depart.flight .leg-flight-depart .leg-flight-station', $this).text();
            res.Dest = $('.leg.return.flight .leg-flight-depart .leg-flight-station', $this).text();
            res.prices = [];

            res.prices = $('.details-group-altquotes-wrapper li a', $this).map(function() {
                return parsePriceHTML($(this));
            });

            res.prices = res.prices.filter(function(item) {
                return item != undefined;
            });

            res.prices = $.makeArray( res.prices );

            res.prices.unshift({
                Price : $('.mainquote-wrapper a.mainquote-price', $this).text(),
                OTA : $('.mainquote-wrapper a.mainquote-agent', $this).text(),
            });

            return res;
        });
        res.Itineraries = $.makeArray( res.Itineraries );
        if(res.Itineraries.length != 10)
        {
            //console.log("no result found");
            return;
        }
        //console.log("Publishing Result!");
        searchdataChannel.publish('NewRes', res);
    });
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
