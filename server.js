var config = require('./config')
var levelup = require('levelup')

var config = {
  development: {
    port: process.env.PORT || 8008,
    ip: '127.0.0.1',
    db: './choicesdb',
    token: null,
    prettyHtml: true
  }
}
var db = levelup(config.db)

// var http = require('http')
// var express = require('express')
// var fs = require('fs')
// var mime = require('mime')

// var app = express()
// var config = require('./node/config')
// var db = require('./node/leveldb')
// var fetch = require('./node/fetchInfo')


// updateDaily()

// app.get(/.*/, function(req, res) {
//   write(res, req.url)
// })

// var server = app.listen(config.port, config.ip)
// console.log('server running on port '+config.port+'.')

// //create new websocket
// socket.createNew(server)
    
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

// function write(res, file, options) {
//   if (file == '/') {
//     file = __dirname+'/public/index.html'
//   }
//   else if (file.match('bannock_weather.json') ) {
//     return callJSON(res)
//   }
//   else 
//     file = file.replace('/', __dirname+'/public/')

//   options = options || null
//   fs.readFile(file, options, function(err, data) {
//     if (err) return console.error(err)
//     res.writeHead(200, {'Content-Type': mime.lookup(file)})
//     res.write(data)
//     res.end()
//   })
// }

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