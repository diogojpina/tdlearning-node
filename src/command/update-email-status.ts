import { Command } from 'commander'
import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'

import { GithubService } from '../services/GithubService'

import { Email } from '../model/Email'
import { EmailTracking } from '../model/EmailTracking'

config({ path: path.join(__dirname, '../.env') })

class UpdateEmailStatus {
  private options: any;

  public constructor (options) {
    this.options = options
  }

  public async run () {
    const octokit = await GithubService.getOctokit()

    await this.updateEmailTracking()

    const limit = this.options.limit ? parseInt(this.options.limit) : 10
    const emails = await Email.find({ locked: false }).limit(limit)
    for (const email of emails) {
      console.log('email', email.email)

      if (email.ttl >= 3 || email.clicked === true) {
        email.locked = true
        await email.save()

        await this.nextProject(email.email)
      }
    }

    process.exit(0)
  }

  private async nextProject (emailStr: string) {
    const emailsTriedCount = await Email.findOne({ email: emailStr, locked: true, ttl: { $gte: 3 }, clicked: false }).countDocuments()
    if (emailsTriedCount >= 3) return

    const email = await Email.findOne({ email: emailStr, locked: true, ttl: 0 }).sort({ forks: -1 })
    if (email === null) return

    email.locked = false

    const date = new Date()
    date.setDate(date.getDate() - 1)
    email.updatedAt = date
    await email.save()

    console.log('email-next', email.email)
  }

  private async updateEmailTracking () {
    const emailTrackings = await EmailTracking.find({ processed: { $ne: true } })
    for (const emailTracking of emailTrackings) {
      const date = new Date(emailTracking.timestamp * 1000)

      const email = await Email.findOne({ email: emailTracking.email, locked: false })

      if (emailTracking.event === 'unsubscribed') {
        await Email.updateMany({ email }, { $set: { locked: true, unsubscribed: true, unsubscribedAt: date } })
        continue
      }

      if (!email) continue

      console.log(`email: ${emailTracking.email} - event: ${emailTracking.event}`)

      if (emailTracking.event === 'processed') {
        email.processed = true
        email.processedAt = date
      } else if (emailTracking.event === 'delivered') {
        email.delivered = true
        email.deliveredAt = date
      } else if (emailTracking.event === 'open') {
        email.opened = true
        email.openedAt = date
      } else if (emailTracking.event === 'click') {
        email.clicked = true
        email.clickedAt = date
      }
      await email.save()

      emailTracking.processed = true
      await emailTracking.save()
    }
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

  const updateEmailStatus = new UpdateEmailStatus(options)
  updateEmailStatus.run()
})
