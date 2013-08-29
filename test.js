// var mongoDbConnection = require('./connection');

// mongoDbConnection(function(databaseConnection) {
//     databaseConnection.collection('blocks')
//                       .find({'time':{$gte:1375690741000}})
//                       .toArray(function(err,arr){console.log(arr);});
// });


var blockchain=require('./blockchain');

blockchain.getblock('000000000000003d21a3388dd37b3fa90732024cb52e59c2f06558eba7a76f2b',function(res){console.log(res.size);});
