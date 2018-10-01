const WebSocket = require('ws')
const daemon = require('./daemon')

const config = {
  daemonHost: '127.0.0.1',
  daemonPort: 18081,
  address: '4ABSL5B2UGsDBdHQfhTonz8YTAQHXBxkKBKzb73Zfh5G35s2k5G8Gcp8sZ8bmWdNaGfkV1Px7DMNt7iWCCvsFRWQ59u2fGR',
  defaultAddress: '4ABSL5B2UGsDBdHQfhTonz8YTAQHXBxkKBKzb73Zfh5G35s2k5G8Gcp8sZ8bmWdNaGfkV1Px7DMNt7iWCCvsFRWQ59u2fGR',
  port: 8080
}

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
      var miner = { address: this.config.defaultAddress, worker: '' }

      ws.on('message', (msg) => {
        if (msg[0] === '1') { miner = { address: msg.slice(1, 96), worker: msg.slice(96) } }
        if (msg[0] === '2') { ws.send(block.blockhashing_blob + block.height + ',' + block.difficulty) }
        if ((msg[0] === '3') && (parseInt(msg.slice(10)) === block.height)) {}
      })
    })
  }

  stop () {
    clearInterval(this.blockTimer);
    this.wss.close()
  }
}
