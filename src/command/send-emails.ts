import { Command } from 'commander'
import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'

import { GithubService } from '../services/GithubService'

import { MailService } from '../services/MailService'
import { Email } from '../model/Email'

config({ path: path.join(__dirname, '../.env') })

class SendEmails {
  private options: any;

  public constructor (options) {
    this.options = options
  }

  public async run () {
    const octokit = await GithubService.getOctokit()

    const mailService = new MailService()

    const emails = await Email.find({ processed: false, locked: false })
    for (const email of emails) {
      console.log('email', email)

      await mailService.sendEmail('diogojpina@gmail.com', email.subject, email.html, email.text)
    }

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

  const sendEmails = new SendEmails(options)
  sendEmails.run()
})
