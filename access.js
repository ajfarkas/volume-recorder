const startBtn = document.getElementById('start');
const svg = d3.select('#graph')
let audioCtx
let analyser = undefined
let datum = undefined // single set of sound data
let maxVol = undefined
let data = []
let interval = undefined
let timeSpan = 30000
let form = []
const debug = {n: 0, total: 0, average: null}

const CIRCLE_BASIS = 0.1
const LIGHT = {
  RED: 5000,
  YELLOW: 2000,
  GREEN: 0,
}

const Graph = {
  kind: 'CIRCLE',
  CIRCLE: {
    draw: console.log,
    interval: 10,
  },
  LINE:  {
    draw: console.log,
    interval: 10
  }
}

const setCSSVar = (prop, val) => {
  document.documentElement.style.setProperty(prop, val)
}

// set d3 config
let width, height, margin, plot, x, y, xAxis, yAxis
const setGraphConfigs = () => {
  width = timeSpan,
      height = timeSpan/5
  svg.attr('viewBox', '0 0 '+width+' '+height)
  margin = {
    top: 0, 
    right: width / 30, 
    bottom: height / 6, 
    left: width / 6
  }
  plot = {
    width: width - margin.right - margin.left,
    height: height - margin.top - margin.bottom
  }
  // x-axis is time
  x = d3.time.scale()
    .range([0, plot.width])
  // y-axis is numerical
  y = d3.scale.linear()
    .range([plot.height, 0])
  // set axis scales
  xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .tickFormat('')
    .tickSize(0, 0)

  yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .tickFormat('')
    .tickSize(600, null).ticks(11)
}

// halt the process
const stop = () => {
  return clearInterval(interval)
}
// send data to server for storage
const storeData = formData => {
  // reset form but keep data for this function
  form = []
  const XHR = new XMLHttpRequest()
  XHR.addEventListener('load', loadEv => {
    console.log('data sent')
  })
  XHR.addEventListener('error', console.error)

  XHR.open('POST', `${location.origin}/audiodb/`)
  XHR.setRequestHeader('Content-Type', 'application/json')
  XHR.send(JSON.stringify(formData))
}

const getVolume = () => {
  analyser.getByteTimeDomainData(datum)

  const vol = datum.reduce((a, b) => (
    a + Math.abs(b - 128)
  ))

  return vol
}

const updateGraph = display => {
  if (!display) {
    const vol = getVolume();

    dataObject = {
      time: Date.now(),
      vol: vol
    }
    data.push(dataObject)
    form.push(dataObject)
    if (form.length >= 2000) {
      storeData(form)
    }
  }

  // set time span to show
  const latest = data.length
    ? data[data.length - 1].time
    : 0
  const first = latest - timeSpan
  // trim data to show only span
  data.some((d, i) => {
    if (d.time < first) {
      data.splice(i, 1)
    } else {
      return true
    }
  })
  
  x.domain([first, latest])
  y.domain([0, maxVol])

  const line = d3.svg.line()
    .x(d => x(parseInt(d.time)))
    .y(d => y(d.vol))
  // make the graph
  let graph = undefined

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

const minmax = { min: 999, max: 0 }
const drawCircle = () => {
  const vol = getVolume() - 128
  const volDiameter = (vol) * CIRCLE_BASIS
  let color = 'green'

  setCSSVar('--circle-d', volDiameter)
  if (vol >= LIGHT.RED) color = 'red'
  else if (vol >= LIGHT.YELLOW) color = 'yellow'
  setCSSVar('--stoplight', `var(--${color})`)

  if (vol < minmax.min && vol > 0) minmax.min = vol
  if (vol > minmax.max) minmax.max = vol
    document.querySelector('.display').innerText = JSON.stringify(minmax)
}

Graph.LINE.draw = updateGraph
Graph.CIRCLE.draw = drawCircle

// set up audio stream
const getStream = stream => {
  const {draw, interval: drawInterval} = Graph[Graph.kind]
  audioCtx = audioCtx || new AudioContext()

  if (Graph.kind === 'LINE') setGraphConfigs()
  console.log('stream gotten')
  const source = audioCtx.createMediaStreamSource(stream)

  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 2048
  source.connect(analyser)
  datum = new Uint8Array(analyser.frequencyBinCount)
  maxVol = datum.length * 128
  // start graphing
  interval = setInterval(draw, drawInterval)
}

startBtn.addEventListener('click', () => {
  // get permission to access mic
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({audio: true})
      .then(getStream)
      .catch(console.error)
  } else {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
                  || navigator.mozGetUserMedia || navigator.msGetUserMedia
    navigator.getUserMedia({ audio: true }, getStream, console.error)
  }
  startBtn.remove()
});

document.querySelector('#display').addEventListener('click', e => {
  e.preventDefault()
  const XHR = new XMLHttpRequest()
  XHR.addEventListener('load', res => {
    stop()
    data = JSON.parse(this.response)
    if (!data.length) {
      return console.warn('no data returned!')
    }
    timeSpan = data[data.length - 1].time - data[0].time
    setGraphConfigs()
    updateGraph(true)
    console.log(this.response)
  })
  XHR.addEventListener('error', console.error)
  const query = `?time=${Date.now() - 60000}&limit=${30000}`
  XHR.open('GET', location.origin + '/audiodb/' + query)
  XHR.send()
})
