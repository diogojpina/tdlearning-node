import { Command } from 'commander'
import mongoose from 'mongoose'
import path from 'path'
import { config } from 'dotenv'

import { Repository } from '../model/Repository'
import { GithubService } from '../services/GithubService'

import { MailService } from '../services/MailService'
import { SonarService } from '../services/SonarService'

config({ path: path.join(__dirname, '../.env') })

class RelateOldSonarProjects {
  private options: any;
  private sonarService: SonarService;

  public constructor (options) {
    this.options = options
    this.sonarService = new SonarService()
  }

  public async run () {
    const octokit = await GithubService.getOctokit()

    const rows = await this.sonarService.getAllProjectsKee()
    for (const row of rows) {
      const full_name = row.kee.replace(':', '/')

      const repo = await Repository.findOne({ full_name, analyzed: { $ne: 1 } })
      if (repo !== null) {
        console.log('full', full_name)
        repo.analyzed = 1

        await repo.save()
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

  program.parse(process.argv)

  const options = program.opts()

  const relateOldSonarProjects = new RelateOldSonarProjects(options)
  relateOldSonarProjects.run()
})
