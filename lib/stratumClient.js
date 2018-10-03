'use strict'
let net = require('net')
let EventEmitter = require('events')

class StratumClient extends EventEmitter {
  constructor (host, port) {
    super()

    this.host = host
    this.port = port
    this.socket = net.createConnection(port, host)

    this.socket.on('data', (data) => { this.emit('data', data) })
  }

  login (login, pass, rigId, id) {
    var params = { login: login, pass: pass, rigid: rigId, agent: 'kNight' }

    if (pass === undefined) { delete params.pass }
    if (rigId === undefined) { delete params.rigid }

    this.send('login', params, id)
  }

  getjob (id) {
    this.send('getjob', { id: id }, id)
  }

  submit (jobId, nonce, result, id) {
    this.send('submit', { id: id, job_id: jobId, nonce: nonce, result: result }, id)
  }

  send (method, params, id) {
    let data = JSON.stringify({ method: method, params: params, id: id })
    this.socket.write(data + '\n')
  }

  close () {
    this.socket.destroy()
  }
}

module.exports = StratumClient
