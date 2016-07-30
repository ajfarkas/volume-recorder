var levelup = require('levelup')

var config = {
  port: process.env.PORT || 8001,
  ip: '127.0.0.1',
  db: './audiodb',
  token: null,
  prettyHtml: true
}
var db = levelup(config.db)

var http = require('http')
var express = require('express')
var fs = require('fs')
var mime = require('mime')

var app = express()

// updateDaily()

app.get(/.*/, function(req, res) {
  write(res, req.url)
})

app.post('/saveaudio/', function(req, res) {
  req.on('data', function(d) {
    var data = new Buffer(d).toString()
    console.log(data)
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.write('success')
    res.end()
    // var json = JSON.parse(data)
    // console.log('loginreq')

    // if (json.signup) {
    //   console.log('signup:'+json.signup)
    //   login.signup(json, writeIDs.bind(null, res))
    // } else {
    //   login.getIds(json, writeIDs.bind(null, res))
    // }
  })
})

var server = app.listen(config.port, config.ip)
console.log('server running on port '+config.port+'.')
    
// function callJSON(res) {
//   var waitForData = setInterval(function() {
//     console.log('waiting...')
//     if (fetch.data) {
//       clearInterval(waitForData)
//       console.log('results to server')
//       res.write(JSON.stringify(fetch.data))
//       res.end()
//     }
//   }, 100)
// }

function write(res, file, options) {
  if (!file || file == '/') {
    file = __dirname+'/audiocap.html'
  } else {
    file = file.replace('/', __dirname+'/')
  }

  options = options || null
  fs.readFile(file, options, function(err, data) {
    if (err) return console.error(err)
    res.writeHead(200, {'Content-Type': mime.lookup(file)})
    res.write(data)
    res.end()
  })
}

// //update db on regular basis
// function updateDaily() {
//   db.checkForUpdate()
//   //get last millisecond of today
//   var lastUpdate = new Date()
//   lastUpdate.setHours(23)
//   lastUpdate.setMinutes(59)
//   lastUpdate.setSeconds(59)
//   lastUpdate.setMilliseconds(999)
  
//   //update no later than 2am
//   var updateDaily = setInterval(function() {
//     var today = new Date()
//     if (today > lastUpdate) {
//       db.checkForUpdate()
//       lastUpdate = today
//     }
//   }, 7200000)
// }