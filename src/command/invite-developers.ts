import { Command } from 'commander'
import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'

import { Organization } from '../model/Organization'
import { Repository } from '../model/Repository'
import { User } from '../model/User'
import { GithubService } from '../services/GithubService'

import { MailService } from '../services/MailService'

config({ path: path.join(__dirname, '../.env') })

class InviteDevelopers {
  private options: any;

  public constructor (options) {
    this.options = options
  }

  public async run () {
    const octokit = await GithubService.getOctokit()

    const mailService = new MailService()

    // const htmlTemplateFile = '/projects/technicaldebt/tdlearning-node/email-template/invitation.html'
    // const html = await mailService.applyTemplate(htmlTemplateFile, vars)

    // const textTemplateFile = '/projects/technicaldebt/tdlearning-node/email-template/invitation.txt'
    // const text = await mailService.applyTemplate(textTemplateFile, vars)
    // console.log(text)

    // await mailService.sendEmail('diogojpina@gmail.com', 'Test', html, text)

    const skip = this.options.skip ? parseInt(this.options.skip) : 0
    const limit = this.options.limit ? parseInt(this.options.limit) : 10

    const repos = await Repository.find({ prepared: true, invited: { $ne: 1 } })
      .populate('contributors.user')
      .skip(skip)
      .limit(limit)

    for (const repo of repos) {
      console.log('full_name', repo.full_name)
      console.log('repo', repo)
      // console.log('repo', repo.contributors)
      let i = 0
      for (const contributor of repo.contributors) {
        const user = contributor.user
        // console.log('contributor-login', user.login)
        // console.log('email', user.email)
        if (contributor.status === 0 && this.validateEmail(user.email) === true) {
          // console.log('contributor', user)

          const vars: any = {
            participant: {
              name: user.name
            },
            project: {
              name: repo.name,
              baseUrl: 'https://www.tdprioritizationresearch.com/?project=$project->kee&user=$participant->participant_id',
              url: 'https://www.tdprioritizationresearch.com/questionnaire.html?project=groupon:Message-Bus&user=225',
              cancelUrl: 'https://api.tdprioritizationresearch.com/cancelInscription.php?code=$participant->code&project=$project->kee&user=$participant->participant_id'
            },
            consentUrl: 'https://www.tdprioritizationresearch.com/research_web_consent-final.pdf'
          }
        } else if (contributor.status === 0) {
          contributor.status = 2
        }
        i++
      }
      // console.log(repo.contributors)
      // await Repository.updateOne({ _id: repo.id }, { invited: true, contributors: repo.contributors})
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
