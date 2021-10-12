import { Command } from 'commander'
import mongoose from 'mongoose'

import { Repository } from '../../model/Repository'
import { User } from '../../model/User'

import path from 'path'
import { config } from 'dotenv'
import { GithubService } from '../../services/GithubService'
import { SonarService } from '../../services/SonarService'

config({ path: path.join(__dirname, '../../.env') })

class EmailStats {
  private sonarService: SonarService;
  construtor () {
    this.sonarService = new SonarService()
  }

  public async run () {
    const octokit = await GithubService.getOctokit()

    await this.connectMongo()

    const emails: string[] = []
    let repos: any
    try {
      repos = await Repository.find({ prepared: true })
        .populate('contributors.user')
    } catch (error) {
      console.log('error', error)
    }

    const reposCount = repos.length
    console.log('repos-count', reposCount)

    let totalUsers = 0
    let i = 1
    for (const repo of repos) {
      // console.log('full_name', repo.full_name)
      if ((i % 100) === 0) {
        console.log(`${i}/${reposCount}`)
      }
      i++

      for (const contributor of repo.contributors) {
        const user = contributor.user

        if (user.email === null || user.email === undefined) continue
        // console.log('email', user.email)
        // console.log('contributor', contributor)

        if (!emails.find(item => item === user.email)) {
          emails.push(user.email)
        }

        totalUsers++
      }
    }

    console.log('total-users', totalUsers)
    console.log('unique-emails', emails.length)
    process.exit(0)
  }

  public async connectMongo () {
    const host = process.env.MONGO_DB_HOST
    const port = process.env.MONGO_DB_PORT
    const user = process.env.MONGO_DB_USER
    const pass = process.env.MONGO_DB_PASS
    const name = process.env.MONGO_DB_NAME

    await mongoose.connect(`mongodb://${user}:${pass}@${host}:${port}/${name}?authSource=admin`, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true
    })
  }
}

const program = new Command()
program.version('0.0.1')

program
  .option('-p, --path <path>', 'git path')
  .option('-u, --url <url>', 'git URL to clone')
  .option('-n, --project-name <name>', 'project name')

program.parse(process.argv)

const options = program.opts()

const emailStats = new EmailStats()
emailStats.run()
