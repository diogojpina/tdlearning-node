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
  private ignoreHourLock = false

  public constructor (options) {
    this.options = options
    if (this.options.ignoreHourLock === 'true') {
      this.ignoreHourLock = true
    }
  }

  public async run () {
    const octokit = await GithubService.getOctokit()

    if (this.ignoreHourLock === false) {
      const now = new Date()
      if (now.getDate() === 0 || now.getDate() === 6) {
        console.log('Not send emails on the weekends')
        process.exit(0)
      }

      if (now.getHours() < 10 || now.getHours() > 14) {
        console.log('Out of time range')
        process.exit(0)
      }
    }

    const mailService = new MailService()

    const updatedAtAvailable = new Date()
    updatedAtAvailable.setDate(updatedAtAvailable.getDate() - 2)

    const limit = this.options.limit ? parseInt(this.options.limit) : 10

    const emails = await Email.find({
      locked: false,
      ttl: { $lt: 3 },
      $or: [
        { updatedAt: { $lte: updatedAtAvailable } },
        { updatedAt: null }]
    }).limit(limit)

    for (const email of emails) {
      try {
        console.log('email', email.email)
        const clicked = await Email.find({ email: email.email, clicked: true }).countDocuments()
        const thanks = clicked > 0

        const smtpId = await mailService.sendEmail(email, thanks)

        email.smtpId = smtpId
        email.ttl = email.ttl ? (email.ttl + 1) : 1
        email.updatedAt = new Date()
        await email.save()
      } catch (error) {
        console.log('error-to-send-email', error)
      }
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
    .option('-i, --ignoreHourLock <ignoreHourLock>', 'Ignore hour and weekend lock')

  program.parse(process.argv)

  const options = program.opts()

  const sendEmails = new SendEmails(options)
  sendEmails.run()
})
