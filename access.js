var audioCtx = new AudioContext()
var source = undefined
var analyser = undefined
var datum = undefined // single set of sound data
var data = []
var interval = undefined
var svg = d3.select('#graph')
var timeSpan = 30000
// set d3 config
var width = timeSpan,
    height = timeSpan/5
svg.attr('viewBox', '0 0 '+width+' '+height)
var margin = {
  top: 0, 
  right: width / 30, 
  bottom: height / 6, 
  left: width / 6
}
var plot = {
  width: width - margin.right - margin.left,
  height: height - margin.top - margin.bottom
}
// x-axis is time
var x = d3.time.scale()
  .range([0, plot.width])
// y-axis is numerical
var y = d3.scale.linear()
  .range([plot.height, 0])
// set axis scales
var xAxis = d3.svg.axis()
  .scale(x)
  .orient('bottom')
  .tickFormat('')
  .tickSize(0, 0)

var yAxis = d3.svg.axis()
  .scale(y)
  .orient('left')
  .tickSize(0, 0).ticks(3)

// halt the process
function stop() {
  return clearInterval(interval)
}

function updateGraph() {
  analyser.getByteTimeDomainData(datum)
  var max = datum.reduce(function (a,b) {
    return a > b ? a : b
  }) - 128
  data.push({
    time: Date.now(),
    vol: max/128
  })

  // remove old data
  if (data.length > timeSpan/10) { // 8640000cs/day
    data.shift()
  }

  // set time span to show
  var timeCap = timeSpan // 1 second
  var latest = data.length
    ? data[data.length - 1].time
    : 0
  
  x.domain([latest - timeCap, latest])
  y.domain([0, 1])

  var line = d3.svg.line()
    .x(function(d) { return x(parseInt(d.time)) })
    .y(function(d) { return y(d.vol) })  
  // make the graph
  var graph = undefined

  if (d3.select( '.graph-g').empty() ) {
    graph = svg.append('g')
        .attr('class', 'graph-g')
        .attr('width', plot.width)
        .attr('height', plot.height)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    //add axes
    graph.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + plot.height + ')')
        .call(xAxis)
      .append('text')
        .attr('dx', (plot.width / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Time')

    graph.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
      .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('dx', (0 - plot.height / 2))
        .attr('dy', '-2.8em')
        .style('text-anchor', 'middle')
        .text('Max Volume');
  } else {
    graph = d3.select('.graph-g')
  }

  // remove old line
  graph.select('.line').remove()
  //add data line
  graph.append('path')
    .datum(data)
    .attr('class', 'line')
    .attr('d', line)
}

// set up audio stream
function getStream(stream) {
  console.log('stream gotten')
  source = audioCtx.createMediaStreamSource(stream)
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 2048
  source.connect(analyser)
  datum = new Uint8Array(analyser.frequencyBinCount)
  // start graphing
  interval = setInterval(updateGraph, 10)
}

function throwErr(a, b, c, d) {
  console.error(a, b, c, d)
}
// get permission to access mic
if (navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia({audio: true})
    .then(getStream)
    .catch(throwErr)
} else {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
                || navigator.mozGetUserMedia || navigator.msGetUserMedia
  navigator.getUserMedia({ audio: true }, getStream, throwErr)
}