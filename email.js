var nodemailer = require("nodemailer");

var smtpTransport = nodemailer.createTransport("Sendmail", "/usr/sbin/sendmail");

var hogan = require("hogan.js");

var templ_boards = hogan.compile("<h3>Failed Boards</h3><table>{{#boards}}<tr><td>{{url}}</td></tr>{{/boards}}</table>");

// setup e-mail data with unicode symbols
var mailOptions = {
    from: "Keng Dong<dokeng@sz.com>", // sender address
    // to: "naituida@foxmail.com, 496731243@qq.com, so_won315@163.com", // list of receivers
    to : "naituida@foxmail.com",
    // subject: "Test Alert", // Subject line
    // text: "Fix Now", // plaintext body
    // html: "<b>Fix Now</b>" // html body
};


function comp_IP(a,b) {
    var num_a = a.split('.');
    var num_b = b.split('.');
    var test = (parseInt(num_a[2])*1000+parseInt(num_a[3])) - (parseInt(num_b[2])*1000+parseInt(num_b[3]));
    if(test>0) {
  	return 1;
    } else if(test<0) {
  	return -1;
    } else return 0;
};


function sendBoardsMail(boards) {
    var info = boards.sort(comp_IP).map(function(url){return {"url":url}});
    var html = templ_boards.render({"boards":info});
    mailOptions.html = html;
    mailOptions.subject = "Dead Blade";
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function(error, response){
	if(error){
            console.log(error);
	}else{
            console.log("Message sent: " + response.message);
	}
	smtpTransport.close(); 
    });
}

var test_boards = [ 
    '192.168.110.160',
    '192.168.106.138',
    '192.168.115.140',
    '192.168.114.219',
    '192.168.115.110',
    '192.168.116.233',
    '192.168.143.12',
    '192.168.115.6' ]

sendBoardsMail(test_boards);
