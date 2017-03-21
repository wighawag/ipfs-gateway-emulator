'use strict'
const TestRunner = require('test-runner')
const request = require('req-then')
const LocalWebServer = require('../')
const a = require('assert')

const runner = new TestRunner()

runner.test('basic', async function () {
  const port = 9000 + this.index
  const localWebServer = new LocalWebServer({
    port: port,
    'static.root': 'test/fixture',
    'log.format': 'none'
  })
  localWebServer.start()
  const response = await request(`http://localhost:${port}/one.txt`)
  localWebServer.server.close()
  a.strictEqual(response.data.toString(), 'one\n')
})
