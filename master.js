var argv = require('optimist')
      .usage('Usage: $0 -p [port]')
      .default({'p':80})
      .argv;

var express = require('express');
var faye = require('faye');
var async = require('async');

var bayeux = new faye.NodeAdapter({
  mount:    '/faye',
  timeout:  45
});

var merge = require('./merge');

var moment = require('moment');

var pools  = {};
pools.total_ghs = 0;
pools.info = [];

var app = express();
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

app.set('view engine','html');
app.set('views', __dirname + '/views');
app.enable('view cache');
app.engine('html',require('hogan-express'));
app.set('layout', 'layout');
app.enable("jsonp callback");
//app.set('partials', head: "head") # partails using by default on all pages


app.get('/',function(req,res){ 
  var total_ghs = 0;
  for(var i=0;i<pools.info.length;i++){
    total_ghs+=parseFloat(pools.info[i].hashrate);
  }
  pools.total_ghs=total_ghs.toFixed(2);
  console.log(total_ghs);

  connection(function(db){
    async.parallel({
      series:function(callback){
        db.collection('hashrate')
          .find({'time':{$gte:1375690741000}})
          .sort( { '_id' : -1 } )
          .limit(60480)
          .toArray(function(err,arr){callback(null,arr);});
      },
      blocks:function(callback){
        db.collection('blocks')
          .find({'time':{$gte:+new Date()-7*24*60*60*1000}})
          .sort({'time':1})
          .toArray(function(err,arr){callback(null,arr);});
      }
    },
                   function(err,results){
                     var series = results.series.map(function(item){return [item.time,parseFloat(item.rate)/1000];}).reverse();
                     var blocks = results.blocks.map(function(item){return {'x':item.time,'info':{'hash':item.hash},'y':1};});
                     res.render('index',{'rate':(total_ghs/1000).toFixed(4),'series':JSON.stringify(series),'blocks':JSON.stringify(blocks)});                                        
                     
                   });
    
  });
});

app.get('/blocks',function(req,res){
  connection(function(db){
    db.collection('blocks')
      .find({'time':{$gte:moment().subtract('week',1).valueOf()}})
      .sort({'time':-1})
      .toArray(function(err,arr){
	var blocks = arr.map(function(item){
	  if(item.size) {
	    return {'hash':item.hash,'time':item.time,'size':item.size,'fee':item.fee,'tx_count':item.tx_count,'orphaned':item.orphaned};
	  } else {
	    return {'hash':item.hash,'time':item.time,'notfound':true};
	  }
	});
	res.render('blocks',{'blocks':blocks});
      });
  });
});

var auth = express.basicAuth(function(user, pass, callback) {
  var result = (user === 'asicminer' && pass === 'ngzhangdashabi');
  callback(null /* error */, result);
});

var colors = 
      [ '#208F00',

	'#009322',

	'#01976A',

	'#01849C',

	'#02419F',

	'#0C02A4',

	'#5803A7',

	'#A603AC',

	'#AF0465',

	'#B40418' ];

app.get('/servers',auth,function(req,res){
  for(var i=0;i<pools.info.length;i++) {
    var ratio=(pools.info[i].hashrate/pools.info[i].workers);
    pools.info[i].ratio= ratio.toFixed(2);
    var index = (100-Math.floor(parseFloat(ratio)*10));
    if(index<0) index=0;
    if(!pools.info[i].alive || isNaN(index)) index=9;
    if(index>9) index=9;
    pools.info[i].color=colors[index];
  };
  res.render('servers',{'servers':pools.info});
});


app.get('/getHashRate',function(req,res){
  res.jsonp({"rate":pools.total_ghs});
});

var moment = require('moment');

app.get('/getData/(([0-5])?)',function(req,res){
  var dur = req.params[0];
  if(dur) {
    dur = parseInt(dur);
  } else {
    dur = 0;
  }
  var now = moment();
  var limit = [
    1375690741000,
      +now.subtract('hour',6),
      +now.subtract('hour',12),
      +now.subtract('week',1),
      +now.subtract('month',1)
  ];
  connection(function(db){
    async.parallel({
      series:function(callback){
        db.collection('hashrate')
          .find({'time':{$gte:limit[dur]}})
          .sort( { '_id' : -1 } )
          .limit(60480)
          .toArray(function(err,arr){callback(null,arr);});
      },
      blocks:function(callback){
        db.collection('blocks')
          .find({'time':{$gte:limit[dur]}})
          .sort({'time':1})
          .toArray(function(err,arr){callback(null,arr);});
      }
    },function(err,results){
      var series = results.series.map(function(item){return [item.time,parseFloat(item.rate)/1000];}).reverse();
      var blocks = results.blocks.map(function(item){return {'x':item.time,'info':{'hash':item.hash},'y':1};});
      res.jsonp({"hashrate":series,"blocks":blocks});
    });
  });
});

// app.get('/command/:name', function(req, res) {
//   bayeux.getClient().publish('/command', {text: req.params.name});
//   res.send(200);
// });

var connection = require('./connection');

var count = 0;
var blocks = [];
var dead = [];
var down = [];

var blockchain = require('./blockchain');
var hash_cache = {};

bayeux.bind('publish', function(clientId, channel, data) {
  if(channel=='/stat') {
    count++;
    if(count>6) {
      pools.info = merge.merge(pools.info,data);
      var total_ghs = 0;
      blocks = [];
      dead = [];
      down = [];
      for(var i=0;i<pools.info.length;i++){
	total_ghs+=parseFloat(pools.info[i].hashrate);
	blocks = merge.merge2(blocks,pools.info[i].blocks);
	dead = merge.merge2(dead,pools.info[i].dead);
        if(!pools.info[i].alive) {
          down.push(pools.info[i].url);
        }
      }
      pools.total_ghs=total_ghs.toFixed(2);
      console.log("got message");
      console.log(data);
      console.log(blocks);
      console.log(dead);
      console.log(down);
      if(pools.info.length>8) {
	connection(function(db) {
	  db.collection('hashrate',function(err,col){
	    col.insert({'rate':pools.total_ghs,'time':+new Date()},{w:1},function(){});
	  });
	  db.collection('blocks',function(err,col){
	    async.map(blocks,function(block){
	      if(!hash_cache[block.hash]) {
		hash_cache[block.hash]=true;
		console.log("Retrieving block:",block.hash);
		blockchain.getblock(block.hash,function(res) {
		  if(!res.notfound) {
		    console.log("Found block!");
		    col.update({'hash':block.hash},
			       {'hash':block.hash,
				'time':+ new Date(block.timestamp),
				'size':res.size,
				'fee':(parseInt(res.fee)/100000000.0).toFixed(8),
				'tx_count':res.n_tx,
				'orphaned':!(res.main_chain),
				'height':res.height
			       },
			       {upsert:true},function(err,res){console.log(err);});
		  } else {
		    col.update({'hash':block.hash},
			       {'hash':block.hash,
				'time':+ new Date(block.timestamp)
			       },
			       {upsert:true},function(err,res){console.log(err);});
		  }
		});
	      }
	    },function(err,result) {});
	  });
	});
      }
    };
  }
});

var server = app.listen(argv.p);


var serverAuth = {
  incoming: function(message, callback) {
    // Get subscribed channel and auth token
    var subscription = message.subscription,
        msgToken     = message.ext && message.ext.authToken;

    console.log(message.ext);
    if (msgToken!=='PinkFloydIsTheWorst')
      message.error = 'Invalid subscription auth token';
    // Call the server back now we're done
    callback(message);
  }
};

bayeux.addExtension(serverAuth);

bayeux.attach(server);
