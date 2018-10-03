const net = require('net')
const WebSocket = require('ws')
const StratumClient = require('./stratumClient')

class Proxy {
  constructor (config) {
    this.poolHost = config.poolHost
    this.poolPort = config.poolPort
    this.poolPass = config.poolPass
    this.port = config.port
  }

  start () {
    this.wss = new WebSocket.Server({ port: this.port })
    this.stratumClient = new StratumClient(this.poolHost, this.poolPort)

    this.wss.broadcast = (data) => {
      this.wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    };

    var count = 1
    var clients = {}

    this.stratumClient.on('data', (data) => {
      data = JSON.parse(data)

      if (data.id === undefined) {
        this.wss.broadcast(`1,${data.params.blob},${data.params.job_id},${data.params.target}`)
      } else if (data.error !== null) {
        clients[data.id].send(`2,${data.error.message}`)
      }
    })

    this.wss.on('connection', (ws) => {
      var id = count
      clients[count] = ws
      count++

      ws.on('message', (msg) => {
        var tmp = msg.split(',')
        switch (tmp[0]) {
          case '1':
            this.stratumClient.login(tmp[1], this.poolPass, tmp[2], id)
            break
          case '2':
            this.stratumClient.getjob(id)
            break
          case '3':
            this.stratumClient.submit(tmp[1], tmp[2], tmp[3], id)
            break
        }
      })
    })
  }

  stop () {
    this.wss.close()
    this.stratumClient.close()
  }
}

module.exports = Proxy
