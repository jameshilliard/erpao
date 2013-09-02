// one-time script to add 'rand' attribute for db.hashrate
var connection = require('./connection');

var async = require('async');

var count = 0;
function add_all() {
  connection(function(db) {
    var stream = db.collection('hashrate').find().batchSize(10000).stream();

    stream.on('data', function (item){
      count++;
      db.collection('blocks').update({'time':item.time},{$set:{'rand':Math.random()}},{},function(err,res){if(err) console.log(err);});
      stream.pause();
      // Restart the stream after 1 miliscecond
      setTimeout(function() {
        stream.resume();
      }, 1);
    });
    stream.on('close', function(){
      console.log("Updated %d items",count);
      db.close();
    });
  });
};

add_all();
