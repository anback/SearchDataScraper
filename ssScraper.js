var page = require('webpage').create();
var args = require('system').args;
var url = args[1];
page.viewportSize = {
  width: 1920,
  height: 912
};

page.onResourceReceived = function(response) {
    if(response.url.indexOf("seenquoteprice") == -1)
        return;

    console.log(readPage(page));
    phantom.exit();
};

function readPage(page) {
    return page.evaluate(function() 
    {
        return document.documentElement.outerHTML;
    });
}

page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36';
page.open(url, function (status) {
    
});

setTimeout(function() {
        console.log(readPage(page));
        phantom.exit();
}, 30000);

    /*
    waitFor(function() 
    {
        var res = page.evaluate(function() {
            if(document.getElementsByClassName("header-info-bestprice").length > 0)
                return true;
        });

        if(res)
        {
            console.log(readPage(page));
            return true;
        }

        return false;
    }, function() {
        console.log(readPage(page));
        phantom.exit();
    }, 60000);
   

function waitFor(testFx, onReady, timeOutMillis) {
    
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    //console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    //console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 1000); //< repeat check every 250ms
}

 */
