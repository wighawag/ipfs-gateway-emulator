const Lws = require('lws')

/**
 * @module ipfs-gateway-emulator
 */

/**
  * @alias module:ipfs-gateway-emulator
  */
class IPFSGatewayEmulator extends Lws {
  _getDefaultConfig () {
    return Object.assign(super._getDefaultConfig(), {
      moduleDir: [ '.', __dirname ],
      stack: require('./lib/default-stack')
    })
  }
}

module.exports = IPFSGatewayEmulator
