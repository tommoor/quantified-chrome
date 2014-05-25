var aMonthAgo = moment().subtract('days', 30)
var now = moment();
var db = new PouchDB('quantified-chrome');

// hostname visits
db.query({
    map: function(doc, emit) {
        if (doc.openedAt > aMonthAgo && doc.openedAt < now && doc.hostname) {
            emit(doc.hostname, 1);
        }
    }, 
    reduce: '_count'
}, {group: true}, function(err, response) {
    if (err) return console.warn(err);
    
    response = _.sortBy(response.rows, function(doc){ return -doc.value; });
    response = response.slice(0,20);
    
    //Regular pie chart
    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .x(function(d) { return d.key })
            .y(function(d) { return d.value })
            .showLabels(true);

        d3.select("#monthly-hostname-visits svg")
            .datum(response)
            .transition().duration(350)
            .call(chart);

        nv.utils.windowResize(chart.update);
        return chart;
    });
});


// hostname time spent
db.query({
    map: function(doc, emit) {
        if (doc.openedAt > aMonthAgo && doc.openedAt < now && doc.hostname) {
            emit(doc.hostname, Math.round(doc.timeSelected/1000/60));
        }
    }, 
    reduce: '_sum'
}, {group: true}, function(err, response) {
    if (err) return console.warn(err);
    
    response = _.sortBy(response.rows, function(doc){ return -doc.value; });
    response = response.slice(0,20);
    
    //Regular pie chart
    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .x(function(d) { return d.key })
            .y(function(d) { return d.value })
            .showLabels(true);

        d3.select("#monthly-hostname-time svg")
            .datum(response)
            .transition().duration(350)
            .call(chart);

        nv.utils.windowResize(chart.update);
        return chart;
    });
});

// tabs per hour
db.query({
    map: function(doc, emit) {
        var openedHour = moment(doc.openedAt).format('h a');;
        emit(openedHour, 1);
    }, 
    reduce: '_count'
}, {group: true}, function(err, response) {
    if (err) return console.warn(err);
    
    // fill out array for presentation
    var hours = _.range(1, 25);
    
    _.each(hours, function(hour){
        var ampm = "am";
        var display = hour;
        if (hour > 12) {
            display -= 12;
            ampm = "pm";
        }
        
        var key = display + " " + ampm;
        var exists = _.find(response.rows, function(doc){ return doc.key == key; });
        if (!exists) {
            response.rows.push({key: key, value: 0, sort: hour});
        } else {
            exists.sort = hour;
        }
    });
    
    response = _.sortBy(response.rows, function(doc){ return doc.sort; });
    
    nv.addGraph(function() {
        var chart = nv.models.discreteBarChart()
            .x(function(d) { return d.key }) 
            .y(function(d) { return d.value })
            .tooltips(false)
            .showValues(true);
        
        d3.select('#hourly-tabs svg')
            .datum([{values: response}])
            .transition().duration(350)
            .call(chart);

        nv.utils.windowResize(chart.update);
        return chart;
    });
});
