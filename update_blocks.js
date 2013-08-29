
var argv = require('optimist')
             .usage('Usage: $0 -d [day]')
             .default({'d':1})
             .argv;

var blockchain = require('./blockchain');

var connection = require('./connection');

var async = require('async');

var moment = require('moment');
var sleep  = require('sleep');
var now = moment();
var day = argv.d

exports.update_all = function () {
  connection(function(db) {
    db.collection('blocks').find({"size":{$exists:false},"time":{$gt:now.subtract('day',day).valueOf()}})
      .toArray(function(err,blocks){
        async.map(blocks,function(block,callback){
          console.log(block.hash);
	  blockchain.getblock(block.hash,function(res) {
//            sleep.sleep(Math.floor(Math.random()*20));
            console.log(!res.notfound);
            if(!res.notfound) {
	      console.log("Updating %s %s",new Date(block.time),block.hash);
	      db.collection('blocks').update({'hash':block.hash},{$set:{
                'size':res.size,
                'fee':(parseInt(res.fee)/100000000.0).toFixed(8),
	        'tx_count':res.n_tx,
	        'orphaned':!(res.main_chain),
	        'height':res.height
	      }},{},function(err,res){console.log(err);});
            }
            callback(null,{"hash":block.hash,"date":new Date(block.time),"res":res});
	  });
        },function(err,results){console.log(results);console.log("end");db.close();});
      });
  });
};

exports.update_single = function (hash) {
  blockchain.getblock(hash,function(res) {
    if(!res.notfound) {
      console.log("Updating %s",block.hash);
      db.collection('blocks').update({'hash':hash},{$set:{
        'size':res.size,
        'fee':(parseInt(res.fee)/100000000.0).toFixed(8),
	'tx_count':res.n_tx,
	'orphaned':!(res.main_chain),
	'height':res.height
      }},{},function(err,res){console.log(err);console.log(res.size);db.close();});
    } 
  });
}


exports.update_all();

