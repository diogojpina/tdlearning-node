import { Command } from 'commander'
import mongoose from 'mongoose'
import fs from 'fs'
import util from 'util'

import path from 'path'
import { config } from 'dotenv'

import { Repository } from '../model/Repository'
import { GithubService } from '../services/GithubService'
config({ path: path.join(__dirname, '../.env') })

class PrepareToInviteDevelopers {
  private options: any;

  public constructor (options) {
    this.options = options
  }

  public async run () {
    const limit = this.options.limit ? parseInt(this.options.limit) : 10

    const octokit = await GithubService.getOctokit()
    const rates = await GithubService.getRates(octokit)
    console.log(rates)
    if (rates.remaining < limit * 2) {
      console.log('Low github rates')
      process.exit(1)
    }

    const repos = await Repository.find({ status: 1, analyzed: 1, prepared: { $ne: true } }).limit(limit)

    for (const repo of repos) {
      try {
        await GithubService.importContributors(octokit, repo)
      } catch (error) {
        console.log(error.message)
        continue
      }

      await Repository.updateOne({ _id: repo._id }, { prepared: true })
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
})

const program = new Command()
program.version('0.0.1')

program
  .option('-l, --limit <limit>', 'Number of repositories to prepare to invite')

program.parse(process.argv)

const options = program.opts()

const prepareToInviteDevelopers = new PrepareToInviteDevelopers(options)
prepareToInviteDevelopers.run()
