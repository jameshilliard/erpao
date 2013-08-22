var nodemailer = require("nodemailer");

// create reusable transport method (opens pool of SMTP connections)
// var smtpTransport = nodemailer.createTransport("SMTP",{
//     service: "Gmail",
//     auth: {
//         user: "ontrack.startup@gmail.com",
//         pass: "PinkFloydIsTheWorst"
//     }
// });
// var smtpTransport = nodemailer.createTransport("SMTP", {
//     host: "smtp.gmail.com", // hostname
//     secureConnection: true, // use SSL
//     port: 465, // port for secure SMTP
//     auth: {
//         user: "ontrack.startup@gmail.com",
//         pass: "PinkFloydIsTheWorst"
//     }
// });

var smtpTransport = nodemailer.createTransport("Sendmail", "/usr/sbin/sendmail");

// setup e-mail data with unicode symbols
var mailOptions = {
    from: "Keng Dong<dokeng@sz.com>", // sender address
    // to: "naituida@foxmail.com, 496731243@qq.com, so_won315@163.com", // list of receivers
    to : "naituida@foxmail.com",
    subject: "Test Alert", // Subject line
    text: "Fix Now", // plaintext body
    html: "<b>Fix Now</b>" // html body
};

// send mail with defined transport object
smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
        console.log(error);
    }else{
        console.log("Message sent: " + response.message);
    }

    // if you don't want to use this transport object anymore, uncomment following line
    smtpTransport.close(); // shut down the connection pool, no more messages
});
