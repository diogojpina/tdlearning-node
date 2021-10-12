import { Command } from 'commander'
import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'

import { Organization } from '../model/Organization'
import { Repository } from '../model/Repository'
import { User } from '../model/User'
import { GithubService } from '../services/GithubService'

import { MailService } from '../services/MailService'
import { SonarService } from '../services/SonarService'
import { Email } from '../model/Email'

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
      .populate('contributors.user')
      .skip(skip)
      .limit(limit)

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

        if (contributor.status === 0 && this.validateEmail(user.email) === true) {
          // console.log('email', user.email)
          // console.log('contributor', user)

          try {
            await this.sendEmail(user, repo)
          } catch (error) {
            contributor.status = 3
            console.log('error', error.message)
          }

          process.exit(0)
        } else if (contributor.status === 0) {
          contributor.status = 2
        }
        i++

        contributor.status = 0
      }

      // // // await Repository.updateOne({ _id: repo._id }, { contributors: repo.contributors })
      // console.log(repo.contributors)
      // await Repository.updateOne({ _id: repo._id }, { invited: true, contributors: repo.contributors})
      console.log(i)
    }
    process.exit(1)
  }

  private async sendEmail (user: any, repo: any): Promise<boolean> {
    console.log('full_name', repo.full_name)
    console.log('email', user.email)

    console.log('repo-contri', repo.contributors.length)

    const siteBaseUrl = process.env.SITE_BASE_URL
    const apiBaseUrl = process.env.API_BASE_URL

    // const projectKee = repo.full_name.replace('/', ':')
    const projectKee = 'AdoptOpenJDK:jitwatch'

    const project = await this.sonarService.getProject(projectKee)
    let participant = await this.sonarService.getParticipantByProjectEmail(project.kee, user.email)
    if (participant === null) {
      participant = await this.sonarService.addParticipant(project.kee, user.email)
    }
    console.log('participant', participant)

    const mailService = new MailService()

    const vars: any = {
      participant: {
        name: user.name
      },
      project: {
        name: repo.name,
        baseUrl: `${siteBaseUrl}/?project=${project.kee}&user=${participant.participant_id}`,
        url: `${siteBaseUrl}/questionnaire.html?project=${project.kee}&user=${participant.participant_id}`,
        cancelUrl: `${apiBaseUrl}/cancelInscription.php?code=${participant.code}&project=${project.kee}&user=${participant.participant_id}`
      },
      consentUrl: process.env.EMAIL_CONSENT_URL
    }

    const htmlTemplateFile = process.env.TEMPLATE_HTML_FILE
    const html = await mailService.applyTemplate(htmlTemplateFile, vars)
    // console.log('html', html)

    const textTemplateFile = process.env.TEMPLATE_TXT_FILE
    const text = await mailService.applyTemplate(textTemplateFile, vars)
    // console.log('text', text)

    const subject = process.env.SUBJECT

    const emailData = {
      email: user.email,
      user: user._id,
      repoFullName: repo.full_name,
      size: repo.size,
      forks: repo.forks,
      repo: repo._id,
      subject: subject,
      html: html,
      text: text,
      smtpId: '',
      processed: false,
      locked: false
    }

    const emailSent = await Email.findOne({ email: user.email, processed: false, locked: false })
    if (emailSent !== null) {
      if (emailSent.forks >= repo.forks) {
        emailData.locked = true
      } else {
        await Email.updateOne({ _id: emailSent._id }, { $set: { locked: true } })
      }
    }
    await Email.collection.insertOne(emailData)

    // console.log('data', data)

    // await mailService.sendEmail('diogojpina@gmail.com', subject, html, text)

    return true
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
