var os = require('os');
var mubsub = require('mubsub');
var isdebug = process.argv[2] == 'debug';
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;
var path = require('path');
var childProcess = require('child_process');
var urlPrefix = 'http://www.skyscanner.de/dataservices/routedate/v2.0/';
var request = require('request');
var cpus = os.cpus();
console.log("IsDebug: " + isdebug);
console.log("Number of CPUs: " + cpus.length);
var importantCities = ['BKK','PMI','IST','NYC','BCN','MIA','AYT','LIS','LON','LAX','DPS','AGP','MAD','HKT','SKG','HAV','HER','LPA','ADB','ATH','SFO','VIE','IBZ','CPT','MUC','DXB','FRA','PAR','CMB','MNL','ROM','AMS','BER','FAO','LAS','KUL','DUB','JFK','SYD','SJO','SIN','FUE','ALC','MEX','HAM','CUN','SCL','SGN','TFS','CPH','HRG','SAW','BUD','TCI','BOG','USM','LIM','OPO','LHR','DEL','SPU','CTA','ZRH','DUS','HKG','VCE','AKL','BUE','NAP','JNB','STO','TLV','RAK','NCE','CDG','BOM','EDI','RIO','MOW','OLB','YVR','CFU','ACE','TYO','CAI','VLC','HNL','MLA','OSL','BEY','MEL','PRG','FCO','STR','FLL','SVO','RHO','WAW','HEL','MAN']

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
    console.log("********** NEW SEARCH ***************")
    console.log("Got: " + data.length + " rows");
    
    var phantomjsCloudurl = 'http://api.phantomjscloud.com/batch/browser/v1/315187e8558d52f13127dc55d9008ac9c6af0c84';

    var body = {
        batchRequests : data.map(function(data) {
            
            var ssUrl = 'http://www.skyscanner.de/transport/fluge/{0}/{1}/{2}/{3}/?usrplace=DE'
            var departureDate = getFormattedDate(data.in_DepartureDate);
            var returnDate = getFormattedDate(data.in_ReturnDate);
            ssUrl = ssUrl.format(data.in_FromCity, data.in_ToCity, departureDate, returnDate);

            if(departureDate.length != 6)
                return undefined;

            if(returnDate.length != 6)
                return undefined;
            
            console.log(ssUrl);

            var res =    
                {
                    targetUrl: ssUrl,
                    requestType: "text",
                    outputAsJson: true,
                    loadImages: false,
                    isDebug: false,
                    postDomLoadedTimeout: 200,
                    delayTime : 50000,
                    //execScripts : {preInjected:["window['pjsc_meta'].remainingTasks++;var cancelHandle = setInterval(function(){var isReady= document.getElementsByClassName('header-info-bestprice').length > 0;if(isReady){window['pjsc_meta'].remainingTasks--;clearInterval(cancelHandle);}},1000);"]},
                    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36",
                    viewportSize : {"height": 1920,"width": 912}
                };
            return res;
        })
    };      

    body.batchRequests = body.batchRequests.filter(function(item) {
        return item != undefined;
    });

    var options = {
        method : 'POST',
        body : JSON.stringify(body),
        headers : { 'Content-Type' : 'application/json' }
    }

    //console.log("sending to PhantomJS cloud");
    request(phantomjsCloudurl, options, function(err, res, jsonBody) {        
        var intervalObject = setInterval(function() {
            var body = JSON.parse(jsonBody);
            console.log("Getting Callbackurl: " + body.callbackUrl);
            request(body.callbackUrl, function(err, res, jsonBody) {

                try {
                    var body = JSON.parse(jsonBody);
                    console.log("StillProcessing: " + body.stillProcessing);
                    if(body.stillProcessing == 0 )
                    {
                        console.log("Clearing Interval");
                        clearInterval(intervalObject);
                    }
                    
                    console.log("justCompleted: " + body.justCompleted.length);
                    body.justCompleted.forEach(function(jsonItem) {

                        try {
                            var item = JSON.parse(jsonItem);
                            parseAndSendSSHTML(item.pageContent);
                        }
                        catch (e) {
                            console.log(e);
                            console.log(jsonItem);
                        }
                    });
                }
                catch (e) {
                    console.log(e)
                    console.log(jsonBody);
                }
            });
        }, 60000);
        //parseAndSendSSHTML(body.pageContent);
    });
    
    */

    data.forEach(function(item) {
        
        dataItems.push(item);

        if(dataItems.length > 20)
            dataItems.shift();
    });

    /*
    count++;
    console.log(count);
    if(count % 3 == 0)
        return;
    */  
}

var dataItems = [];
var processcount = 0;

setInterval(function() {
    console.log(processcount + " processes active.");

    var loadavg = os.loadavg()[0];
    

    console.log("Loadaverage: " + loadavg);
    if(loadavg < cpus.length)
    {
        StartNewWork();
    }
}, 3000);

function StartNewWork() {

    var data = dataItems.pop();

    if(data==undefined)
    {
        setTimeout(StartNewWork, 1000);
        return;
    }

    var ssUrl = 'http://www.skyscanner.de/transport/fluge/{0}/{1}/{2}/{3}/?usrplace=DE';
    var departureDate = getFormattedDate(data.in_DepartureDate);
    var returnDate = getFormattedDate(data.in_ReturnDate);
    ssUrl = ssUrl.format(data.in_FromCity, data.in_ToCity, departureDate, returnDate);

    if(departureDate.length != 6)
        return undefined;

    if(returnDate.length != 6)
        return undefined;

    /*
    if(!importantCities.some(function(importantIata) {
        return importantIata == data.in_ToCity;
    }))
        return;
    */  

    processcount++;
    console.log("Processing " + ssUrl.split('http://www.skyscanner.de/transport/fluge/')[1]);

    var process = childProcess.execFile(binPath, [path.join(__dirname, 'ssScraper.js'), ssUrl], function(err, stdout, stderr) {
        
        parseAndSendSSHTML(stdout);
        StartNewWork();
        processcount--;
    });
    
}

var client = mubsub('mongodb://swalo:84kAanan@ds051658.mongolab.com:51658/swalo');
var searchChannel = client.channel('searches');
var searchdataChannel = client.channel('searchdata');

client.on('error', console.error);
searchChannel.on('error', console.error);


searchChannel.subscribe('NewSearch', function (message) {


    if(!isdebug || count == 0)
    {
        executeSearch(message);
    }

    if(count == 0) {
        StartNewWork();
        StartNewWork();
        StartNewWork();
        StartNewWork();        
    }

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

        console.log("Best Price: " + res.BestPrice + ", Orig: " + res.Itineraries[0].Origin + ", Dest: " + res.Itineraries[0].Dest);
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
