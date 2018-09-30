const request = require('request')

class MoneroClient {
  constructor (host, port) {
    this.host = host
    this.port = port
  }

  getBlockTemplate (address, callback) {
    this.jsonRPC('get_block_template', { wallet_address: address }, callback)
  }

  submitBlock (blob, nonce, callback) {

  }

  jsonRPC (method, params, callback) {
    var options = {
      uri: `http://${this.host}:${this.port}/json_rpc`,
      methods: 'POST',
      json: { jsonrpc: '2.0', id: '0', method: method, params: params }
    }
    request(options, callback)
  }
}

module.exports = { MoneroClient: MoneroClient }
