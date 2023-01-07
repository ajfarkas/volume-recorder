const startBtn = document.getElementById('start')
const stopBtn = document.getElementById('stop')
let audioCtx = undefined
let analyser = undefined
let datum = undefined // single set of sound data
let interval = undefined

const CIRCLE_BASIS = 0.01
const LIGHT = {
	RED: 25000,
	YELLOW: 18000,
	GREEN: 0,
}

const Graph = {
	kind: 'CIRCLE',
	CIRCLE: {
		draw: console.log,
		interval: 10,
	},
	LINE:	{
		draw: console.log,
		interval: 10
	}
}

const setCSSVar = (prop, val) => {
	document.documentElement.style.setProperty(prop, val)
}

const getVolume = () => {
	analyser.getByteTimeDomainData(datum)

	const vol = datum.reduce((a, b) => (
		a + Math.abs(b - 128)
	))

	return vol
}

const minmax = { min: 999, max: 0 }
const drawCircle = zero => {
	const vol = zero ? 0 : getVolume() - 128
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

Graph.CIRCLE.draw = drawCircle

// halt the process
const stop = () => {
	clearInterval(interval)
	drawCircle(true)
	startBtn.style.display = ''
}

// set up audio stream
const getStream = stream => {
	const {draw, interval: drawInterval} = Graph[Graph.kind]
	audioCtx = audioCtx || new AudioContext()

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
	startBtn.style.display = 'none'
});

stopBtn.addEventListener('click', stop)

