var db = new PouchDB('quantified-chrome', {adapter : 'websql'});
var selectedId;
var session = 'tab-' + (new Date()).getTime();

chrome.tabs.getSelected(function(tab) {
    selectedId = tab.id;
});

chrome.tabs.onCreated.addListener(function(tab){
    console.debug('Tab created');
    recordTab(tab);
});

chrome.tabs.onUpdated.addListener(function(tabId, changes){
    var _id = session+tabId;
    
    db.get(_id, function(err, existing){
        console.log(existing);
        console.log(changes);
        
        if (!existing || (existing.url && changes.url && (existing.url != changes.url))) {
            
            chrome.tabs.get(tabId, function(tab){
                console.debug('Tab changed ' + _id);
                recordTab(tab);
            });
        }
    });
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    var _id = session+activeInfo.tabId;
    db.get(_id, function(err, existing){
        if (existing) {
            var data = {
                selectedAt: (new Date()).getTime()
            };
            
            console.debug('Tab activated ' + _id, data);
            db.put(data, _id, existing._rev);
        }
    });
    
    if (selectedId) {
        var _id = session+selectedId;
        db.get(_id, function(err, existing){
            if (existing) {
                var now = (new Date()).getTime();
                var data = {
                    timeSelected: existing.timeSelected + (now-existing.selectedAt)
                };
            
                console.debug('Tab deactivated ' + _id, data);
                db.put(data, _id, existing._rev);
            }
        });
    }
    
    selectedId = activeInfo.tabId;
});

chrome.tabs.onRemoved.addListener(function(tabId){
    var _id = session+tabId;
    db.get(_id, function(err, existing){
        if (existing) {
            var now = (new Date()).getTime();
            var data = {
                closedAt: now,
                timeOpen: now-existing.openedAt
            };
            
            console.debug('Closing tab ' + _id, data);
            db.put(data, _id, existing._rev);
        }
    });
});

var recordTab = function(tab) {
    if (!tab.url || tab.url === "chrome://newtab/") return;
    
    try {
        var hostname = new URL(tab.url).hostname; 
    } catch (e) {
        console.warn(e);
        return;
    }
    
    var _id = session+tab.id;
    var data = {
        openedAt: (new Date()).getTime(),
        timeOpen: 0,
        timeSelected: 0,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        hostname: hostname,
        url: tab.url
    };
    
    console.debug('Recording tab ' + _id, data);
    db.put(data, _id, function(err, success){
        if (err) console.warn(err);
    });
};