import path from 'path'
import { config } from 'dotenv'
import fs from 'fs'
import util from 'util'
import Mustache from 'mustache'
import { SonarService } from './SonarService'
import { Email } from '../model/Email'

import sendgridMail = require('@sendgrid/mail')
config({ path: path.join(__dirname, '../.env') })

const readFile = util.promisify(fs.readFile)

export class MailService {
  private sonarService = new SonarService()

  public async sendEmail (email: Email, thanks=false) :Promise<string> {
    let htmlTemplateFile = process.env.TEMPLATE_HTML_FILE
    if (thanks === true) {
      htmlTemplateFile = htmlTemplateFile.replace('invitation', 'thankyou-invitation')
    }
    const html = await this.applyTemplate(htmlTemplateFile, email.vars)
    // console.log('html', html)

    let textTemplateFile = process.env.TEMPLATE_TXT_FILE
    if (thanks === true) {
      textTemplateFile = textTemplateFile.replace('invitation', 'thankyou-invitation')
    }
    const text = await this.applyTemplate(textTemplateFile, email.vars)
    // console.log('text', text)

    const msg = {
      to: email.email,
      from: { name: process.env.SENDGRID_FROM_NAME, email: process.env.SENDGRID_FROM_EMAIL },
      replyTo: process.env.SENDGRID_REPLYTO,
      subject: email.subject,
      html,
      text
    }

    sendgridMail.setApiKey(process.env.SENDGRID_API_KEY)

    try {
      const response = await sendgridMail.send(msg)
      console.log(response)
      return response[0].headers['x-message-id']
    } catch (error) {
      console.error(error)

      if (error.response) {
        console.error(error.response.body)
      }
      throw error
    }
  }

  public async scheduleEmail (user: any, repo: any): Promise<boolean> {
    console.log('full_name', repo.full_name)
    console.log('email', user.email)

    const siteBaseUrl = process.env.SITE_BASE_URL
    const apiBaseUrl = process.env.API_BASE_URL

    const projectKee = repo.full_name.replace('/', ':')
    // const projectKee = 'AdoptOpenJDK:jitwatch'

    const project = await this.sonarService.getProject(projectKee)
    let participant = await this.sonarService.getParticipantByProjectEmail(project.kee, user.email)
    if (participant === null) {
      participant = await this.sonarService.addParticipant(project.kee, user.email)
    }
    // console.log('participant', participant)

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

    const subject = `Research: TD Prioritization on ${repo.name}`

    const emailData = {
      email: user.email,
      user: user._id,
      repoFullName: repo.full_name,
      size: repo.size,
      forks: repo.forks,
      repo: repo._id,
      vars,
      subject: subject,
      smtpId: '',
      locked: false,
      ttl: 0,
      processed: false
    }

    const emailSent = await Email.findOne({ email: user.email, locked: false })
    if (emailSent !== null) {
      emailData.locked = true
    } else {
      const emailsTriedCount = await Email.findOne({ email: user.email, locked: true, ttl: { $gte: 3 }, clicked: false }).countDocuments()
      if (emailsTriedCount >= 3) {
        emailData.locked = true
      }
    }
    await Email.collection.insertOne(emailData)

    return true
  }

  public async applyTemplate (filepath: string, vars: any) :Promise<string> {
    // console.log(`Loading ${filepath}`)
    const content = await readFile(filepath)
    const contentFilled = Mustache.render(content.toString(), vars)
    return contentFilled
  }
}
