const WebSocket = require('ws')
const daemon = require('./daemon')

var block = {
  'blockhashing_blob': '',
  'blocktemplate_blob': '',
  'difficulty': 0,
  'expected_reward': 0,
  'height': 0,
  'prev_hash': '',
  'reserved_offset': 0,
  'status': 'OK',
  'untrusted': true
}

class Pool {
  constructor (config) {
    this.config = config
    this.daemonClient = new daemon.MoneroClient(config.daemonHost, config.daemonPort)
    this.wss = new WebSocket.Server({ port: config.port })

    this.wss.broadcast = (data) => {
      this.wss.clients.forEach(function each (client) {
        if (client.readyState === WebSocket.OPEN) { client.send(data) }
      })
    }
  }

  start () {
    this.blockTimer = setInterval(() => {
      this.daemonClient.getBlockTemplate(this.config.address, (err, res, body) => {
        if (err) { throw err }
        if (block.height !== body.result.height) {
          block = body.result
          this.wss.broadcast(block.blockhashing_blob + block.height + ',' + block.difficulty)
        }
      })
    }, 10000)

    this.wss.on('connection', (ws) => {
      ws.on('message', (msg) => {
        if (msg[0] === '2') { ws.send(block.blockhashing_blob + block.height + ',' + block.difficulty) }
        if ((msg[0] === '3') && (parseInt(msg.slice(10)) === block.height)) {}
      })
    })
  }

  stop () {
    clearInterval(this.blockTimer)
    this.wss.close()
  }
}

module.exports = Pool
