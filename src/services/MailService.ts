import path from 'path'
import { config } from 'dotenv'
import fs from 'fs'
import util from 'util'

import sendgridMail = require('@sendgrid/mail')
import Mustache from 'mustache'
config({ path: path.join(__dirname, '../.env') })

const readFile = util.promisify(fs.readFile)

export class MailService {
  public async sendEmail (to: string, subject: string, html: string, text: string) :Promise<void> {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      replyTo: process.env.SENDGRID_REPLYTO,
      subject,
      html,
      text
    }

    sendgridMail.setApiKey(process.env.SENDGRID_API_KEY)

    try {
      const response = await sendgridMail.send(msg)
      console.log(response)
    } catch (error) {
      console.error(error)

      if (error.response) {
        console.error(error.response.body)
      }
    }
  }

  public async applyTemplate (filepath: string, vars: any) :Promise<string> {
    console.log(`Loading ${filepath}`)
    const content = await readFile(filepath)
    const contentFilled = Mustache.render(content.toString(), vars)
    return contentFilled
  }
}
