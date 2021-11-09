import { Command } from 'commander'
import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'

import { Repository } from '../model/Repository'
import { GithubService } from '../services/GithubService'

import { MailService } from '../services/MailService'
import { SonarService } from '../services/SonarService'

config({ path: path.join(__dirname, '../.env') })

class InviteDevelopers {
  private options: any;
  private sonarService: SonarService;

  public constructor (options) {
    this.options = options
    this.sonarService = new SonarService()
  }

  public async run () {
    const octokit = await GithubService.getOctokit()

    const skip = this.options.skip ? parseInt(this.options.skip) : 0
    const limit = this.options.limit ? parseInt(this.options.limit) : 10

    const repos = await Repository.find({ prepared: true, invited: { $ne: 1 } })
      .sort({ forks: -1 })
      .populate('contributors.user')
      .skip(skip)
      .limit(limit)

    const mailService = new MailService()

    for (const repo of repos) {
      // console.log('full_name', repo.full_name)
      // console.log('repo', repo)
      // console.log('repo', repo.contributors)
      let i = 0
      for (const contributor of repo.contributors) {
        const user = contributor.user
        // console.log('contributor-login', user.login)
        // console.log('email', user.email)
        // console.log('contrib-user', user)

        // if (contributor.status === 0 && this.validateEmail(user.email) === true) {
        if (this.validateEmail(user.email) === true) {
          // console.log('email', user.email)
          // console.log('contributor', user)

          try {
            await mailService.scheduleEmail(user, repo)
          } catch (error) {
            contributor.status = 3
            console.log('error', error.message)
          }
        } else if (contributor.status === 0) {
          contributor.status = 2
        }
        i++
      }

      await Repository.updateOne({ _id: repo._id }, { $set: { invited: 1, contributors: repo.contributors } })
      console.log(i)
    }
    process.exit(1)
  }

  private validateEmail (email: string):boolean {
    const regularExpression = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return regularExpression.test(String(email).toLowerCase())
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

  const inviteDevelopers = new InviteDevelopers(options)
  inviteDevelopers.run()
})
