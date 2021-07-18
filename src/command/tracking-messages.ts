import { Command } from 'commander'
import mongoose from 'mongoose'

import { Repository } from '../model/Repository'

import path from 'path'
import { config } from 'dotenv'

import client = require('@sendgrid/client');

config({ path: path.join(__dirname, '../.env') })

class TrackingMessages {
  private options: any;

  public constructor (options) {
    this.options = options
  }

  public async run () {
    client.setApiKey(process.env.SENDGRID_API_KEY)
    const request = {
      method: 'GET',
      url: '/v3/user/webhooks/event/settings'
    }

    try {
      const result = await client.request(request)
      console.log('res', result[0].body.result)
    } catch (error) {
      console.log('error', error.response.body.errors)
    }

    process.exit(0)

    const repos = await Repository.find({ invited: 1 })
    console.log(repos)

    process.exit(0)
  }
}

const host = process.env.MONGO_DB_HOST
const port = process.env.MONGO_DB_PORT
const user = process.env.MONGO_DB_USER
const pass = process.env.MONGO_DB_PASS
const name = process.env.MONGO_DB_NAME

mongoose.connect(`mongodb://${user}:${pass}@${host}:${port}/${name}?authSource=admin`, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
}).then(data => {
  const program = new Command()
  program.version('0.0.1')

  program
    .option('-l, --limit <limit>', 'Number of repositories to prepare to invite')

  program.parse(process.argv)

  const options = program.opts()

  const trackingMessages = new TrackingMessages(options)
  trackingMessages.run()
})
