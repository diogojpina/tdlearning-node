import { Command } from 'commander'
import mongoose from 'mongoose'

import { Repository } from '../../model/Repository'
import { User } from '../../model/User'

import { GithubService } from '../../services/GithubService'

import path from 'path'
import { config } from 'dotenv'

config({ path: path.join(__dirname, '../../.env') })

class SampleExportCommand {
  public async run (options: any) {
    const octokit = await GithubService.getOctokit()

    const samplePercent = parseFloat(options.samplePercent)

    const type = options.type

    if (type === 'repo') {
      const repositories = await this.getRepositoriesSample(0.1)
      console.log('repositories', JSON.stringify(repositories))
    } else if (type === 'user') {
      const users = await this.getUsersSample(0.1)
      console.log('users', JSON.stringify(users))
    }

    process.exit(0)
  }

  public async getRepositoriesSample (samplePercent: number) {
    const total = await Repository.find().countDocuments()

    const size = Math.floor(total / (total * (samplePercent / 100)))

    const repositories = []
    for (let i = 0; i < total; i += size) {
      const begin = i
      const end = i + size

      let skip = Math.floor(Math.random() * (end - begin) + begin)
      skip = Math.min(total - 1, skip)
      // console.log(begin, end, skip)

      const repo = await Repository.findOne().skip(skip)
      // console.log('repo', repo)

      repositories.push({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        language: repo?.language,
        size: repo?.size,
        fork: repo?.fork,
        forks: repo?.forks,
        stargazers_count: repo?.stargazers_count,
        watchers_count: repo?.watchers_count
      })
    }

    return repositories
  }

  public async getUsersSample (samplePercent: number) {
    const total = await User.find().countDocuments()

    const size = Math.floor(total / (total * (samplePercent / 100)))

    const users = []
    for (let i = 0; i < total; i += size) {
      const begin = i
      const end = i + size

      let skip = Math.floor(Math.random() * (end - begin) + begin)
      skip = Math.min(total - 1, skip)
      // console.log(begin, end, skip)

      const user = await User.findOne().skip(skip)

      users.push({
        id: user.id,
        login: user.login
      })
    }

    return users
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
})

const program = new Command()
program.version('0.0.1')

program
  .option('-s, --samplePercent <samplePercent>', 'Sample percent')
  .option('-t, --type <type>', 'user or repo')

program.parse(process.argv)

const options = program.opts()

const sampleExportCommand = new SampleExportCommand()
sampleExportCommand.run(options)
