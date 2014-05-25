var aMonthAgo = moment().subtract('days', 30)
var now = moment();
var db = new PouchDB('quantified-chrome', {adapter : 'websql'});

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
    
    //Regular pie chart example
    nv.addGraph(function() {
      var chart = nv.models.pieChart()
          .x(function(d) { return d.key })
          .y(function(d) { return d.value })
          .showLabels(true);

        d3.select("#monthly-hostname-visits svg")
            .datum(response)
            .transition().duration(350)
            .call(chart);

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
    
    //Regular pie chart example
    nv.addGraph(function() {
      var chart = nv.models.pieChart()
          .x(function(d) { return d.key })
          .y(function(d) { return d.value })
          .showLabels(true);

        d3.select("#monthly-hostname-time svg")
            .datum(response)
            .transition().duration(350)
            .call(chart);

      return chart;
    });
});