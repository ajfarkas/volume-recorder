const { Level } = require('level')

const config = {
  port: process.env.PORT || 8001,
  ip: '127.0.0.1',
  db: './audiodb',
  token: null,
  prettyHtml: true
}
const db = new Level(config.db)
// not necessary, makes first call faster.
db.open()

var http = require('http')
var express = require('express')
var fs = require('fs')
var mime = require('mime')
var bodyParser = require('body-parser')

var app = express()
var jsonParser = bodyParser.json()

app.get(/\/audiodb\/.*/, async function(req, res) {
  var data = []
  var query = req.url.match(/\?(.*)/)
  if (query) {
    var time = query[1].match(/time=(\d+)/)
    var limit = query[1].match(/limit=(\d+)/)

    if (!time) {
      console.error('no time query sents')
      return res.sendStatus(400)
    }
    var opts = {
      time: parseInt(time[1]),
      limit: limit ? parseInt(time[1]) + parseInt(limit[1]) : parseInt(time[1]) + 60000
    }
    // get data from ?time to ?time + ?limit
    for await (const d of db.values({
      gte: 'audioDate_' + (opts.time - 40000),
      lte: 'audioDate_' + opts.limit,
      valueEncoding: 'json'
    })) {
      console.log('readStream')
      if (typeof d !== 'object') {
        return false
      }
      var first = null
      var last = d.length
      d.some(function(sample, i) {
        if (first === null && sample.time > opts.time) {
          first = i
        }
        if (sample.time > opts.limit) {
          return last = i + 1
        }
      })
      data = data.concat( d.slice(first || 0, last) )
    }
    // on end
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.write(JSON.stringify(data))
    res.end()
  } else {
    console.error('no query sent')
    return res.sendStatus(400)
  }
   
  console.log(req.url)
})

app.get(/.*/, function(req, res) {
  write(res, req.url)
})

app.post('/audiodb/', jsonParser, async function(req, res) {
  if (!req.body) {
    return res.sendStatus(400)
  }
  
  var data = req.body
  console.log(typeof data + ' received')
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.write('success')
  res.end()

  var key = 'audioDate_' + data[0].time
  await db.put(key, data, { valueEncoding: 'json' }, function(err) {
    if (err) {
      console.error(err)
    }
    console.log('data stored as '+key)
  })
})

var server = app.listen(config.port, config.ip)
console.log('server running on port '+config.port+'.')

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

