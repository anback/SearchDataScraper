var os = require('os');
var mubsub = require('mubsub');
var datejs = require('datejs');
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

var count = 0;

var processcount = 0;

var executeSearch = function(data) {

    data.forEach(function(item) {
        
        dataItems.push(item);

        if(dataItems.length > 20)
            dataItems.shift();
    });
}

var dataItems = [];
var processcount = 0;

setInterval(function() {
    console.log(processcount + " processes active.");

    var loadavg = os.loadavg()[0];
    

    console.log("Loadaverage: " + loadavg);
    if(processcount < 10)
    {
        StartNewWork();
        StartNewWork();
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
    var departureDate = data.in_DepartureDate.toString("yyMMdd")
    var returnDate = data.in_ReturnDate.toString("yyMMdd");

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
        
        //console.log(stdout);
        try {
            parseAndSendSSHTML(stdout);
        }
        catch (e)
        {
            console.log(e);
            console.log(stdout);
        }
        
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

        console.log(res.BestPrice);
        console.log($('.day-list-item').length);
        
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
            console.log("no result found");
            return;
        }

        console.log("Best Price: " + res.BestPrice + ", Orig: " + res.Itineraries[0].Origin + ", Dest: " + res.Itineraries[0].Dest);
        searchdataChannel.publish('NewRes', res);
    });
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
