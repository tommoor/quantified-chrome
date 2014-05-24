var db = new PouchDB('quantified-chrome', {adapter : 'websql'});
var selected;
var session = _.uniqueId();

chrome.tabs.getSelected(function(tab) {
    selected = tab;
});

chrome.tabs.onCreated.addListener(function(tab){
    console.debug('Tab created');
    recordTab(tab);
});

chrome.tabs.onUpdated.addListener(function(tab){
    db.get(session+tab.id, function(err, existing){
        if (!existing || tab.url !== existing.url) {
            console.debug('Tab updated');
            recordTab(tab);
        }
    });
});

chrome.tabs.onActivated.addListener(function(tab){
    db.get(session+tab.id, function(err, existing){
        if (existing) {
            var data = {
                selectedAt: (new Date()).getTime()
            };
            
            console.debug('Tab activated', data);
            db.put(data, session+tab.id, existing._rev);
        }
    });
    
    db.get(session+selected.id, function(err, existing){
        if (existing) {
            var now = (new Date()).getTime();
            var data = {
                timeSelected: timeSelected + (now-existing.selectedAt)
            };
            
            console.debug('Tab deactivated', data);
            db.put(data, session+selected.id, existing._rev);
        }
    });
    
    selected = tab;
});

chrome.tabs.onRemoved.addListener(function(tab){
    db.get(session+tab.id, function(err, existing){
        if (existing) {
            var now = (new Date()).getTime();
            var data = {
                closedAt: now,
                timeOpen: now-existing.openedAt,
                timeSelected: tab.selected ? timeSelected + (now-existing.selectedAt) : existing.timeSelected
            };
            
            console.debug('Closing tab', data);
            db.put(data, session+tab.id, existing._rev);
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
    
    var data = {
        openedAt: (new Date()).getTime(),
        timeOpen: 0,
        timeSelected: 0,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        hostname: hostname
    };
    
    console.debug('Recording tab', data);
    db.put(data, session+tab.id);
};