var db = new PouchDB('quantified-chrome', {adapter : 'websql'});
var selectedId;
var session = (new Date()).getTime();

chrome.tabs.getSelected(function(tab) {
    selectedId = tab.id;
});

chrome.tabs.onCreated.addListener(function(tab){
    console.debug('Tab created');
    recordTab(tab);
});

chrome.tabs.onUpdated.addListener(function(tabId, changes){
    getId(tabId, function(_id, tab){
        db.get(_id, function(err, existing){
            if (!existing || (existing.url && changes.url && (existing.url != changes.url))) {
            
                console.debug('recording as new tab ' + _id);
                recordTab(tab);
            }
        });
    });
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    getId(activeInfo.tabId, function(_id){
        db.get(_id, function(err, existing){
            if (existing) {
                var data = _.extend(existing, {
                    selectedAt: (new Date()).getTime()
                });
            
                console.debug('Tab activated ' + _id, data);
                db.put(data, _id, existing._rev);
            }
        });
    });
    
    if (selectedId) {
        getId(selectedId, function(_id){
            db.get(_id, function(err, existing){
                if (existing) {
                    var now = (new Date()).getTime();
                    var already = existing.timeSelected || 0;
                    var data = _.extend(existing, {
                        timeSelected: already + (now-existing.selectedAt)
                    });
                    
                    console.debug('Tab deactivated ' + _id, data);
                    db.put(data, _id, existing._rev);
                }
            });
        });
    }
    
    selectedId = activeInfo.tabId;
});

chrome.tabs.onRemoved.addListener(function(tabId){
    getId(tabId, function(_id){
        db.get(_id, function(err, existing){
            if (existing) {
                var now = (new Date()).getTime();
                var data = _.extend(existing, {
                    closedAt: now,
                    timeOpen: now-existing.openedAt
                });
            
                console.debug('Closing tab ' + _id, data);
                db.put(data, _id, existing._rev);
            }
        });
    });
});

var getId = function(tabOrTabId, callback) {
    var generate = function(tab) {
        var url = tab.url.replace(/^https?:\/\//, "");
        callback(url+"-"+session+"-"+tab.id, tab);
    }
    
    if (typeof tabOrTabId === "number") {
        chrome.tabs.get(tabOrTabId, function(tab){
            generate(tab);
        });
    } else {
        generate(tabOrTabId);
    }
};

var recordTab = function(tab) {
    if (!tab.url || tab.url === "chrome://newtab/") return;
    
    try {
        var hostname = new URL(tab.url).hostname; 
    } catch (e) {
        console.warn(e);
        return;
    }
    
    getId(tab, function(_id){
        var data = {
            openedAt: (new Date()).getTime(),
            selectedAt: (new Date()).getTime(),
            timeOpen: 0,
            timeSelected: 0,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            hostname: hostname,
            url: tab.url
        };
    
        console.debug('Recording tab ' + _id, data);
        db.put(data, _id, function(err, success){
            if (err) return console.warn(err);
            console.log('Tab recorded ' + _id);
        });
    });
};