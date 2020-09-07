const ADS1115 = require('ads1115')
const connection = [1, 0x4A, 'i2c-bus'] // left=4B,right=4A
const io = require('socket.io-client')
const roundTo = require('round-to')

const lengthConfig = 5
var arr = []

/* function smoothing(value, size) {
	var totalValue = 0
	var smoothed = 0
	for (var i = 0; i < size; i++) {
		totalValue += value[i]
		smoothed = totalValue/(i + 1)
	}
	return Math.floor(smoothed)
} */

const socket = io('http://127.0.0.1:50105')
var config = {
	address: 0x4B,
	channel: 1,
	round: 3,
	interval: 1000
}
socket.on('connect', function () {
	socket.emit('client', 'pandaya-lux')
	socket.on('config', (opts) => {
		console.log('Opts: ', opts)
		config.address = parseInt(opts.address) || config.address
		config.channel = Number(opts.channel) || config.channel
		config.round = Number(opts.round) || config.round
		config.interval = opts.interval || config.interval
	})
	connection[1] = parseInt(config.address)
	console.log('Connection: ', connection)
	setInterval(function () {
		ADS1115.open(...connection)
		.then(async (ads1115) => {
			ads1115.gain = 1
			// if (arr.length < lengthConfig) {
			// 	arr.push(await ads1115.measure('1+GND'))
			// } else {
			// 	console.log('Array: ', arr)
			// 	console.log('Smooth: ', smoothing(arr, lengthConfig))
			// 	arr.shift()
			// }
			var muxParam = config.channel.toString() + '+GND'
			var adcValue = await ads1115.measure(muxParam)
			var vConvert = roundTo(4.096 * adcValue / 32768.0, config.round)
			// console.log('Timestamp: ' + new Date().getTime())
			// console.log('Voltage is: ' + vConvert.toString())
			socket.emit('data', {
				timestamp: new Date().getTime(),
				data: {
					voltage: vConvert
				}
			})
		})
		.catch((err) => {
			console.error(err)
		})
	}, config.interval)
})
socket.on('disconnect', function () {
	console.log('Disconnected from Main Process')
})

