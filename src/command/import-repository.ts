import { Command } from 'commander'
import mongoose from 'mongoose'

import path from 'path'
import { config } from 'dotenv'

import { Repository } from '../model/Repository'
import { GithubService } from '../services/GithubService'

config({ path: path.join(__dirname, '../.env') })

class ImportRepository {
    private limit = 0
    private skip = 0
    private delay = 0

    constructor (options) {
      this.limit = options.limit ? parseInt(options.limit) : 50
      this.skip = options.skip ? parseInt(options.skip) : 1000000
      this.delay = options.delay ? parseInt(options.delay) : 300
    }

    private delayPromise (ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    public async run () {
      const octokit = await GithubService.getOctokit()
      const rates = await GithubService.getRates(octokit)
      console.log(rates)
      if (rates.remaining < 100) {
        console.log('Low github rates')
        process.exit(1)
      }

      console.log('counting')
      // const count = await Repository.find({status: 0}).countDocuments();
      const skip = Math.floor(Math.random() * this.skip)
      console.log('skip', skip)
      const repos = await Repository.find({ status: 0 }).skip(skip).limit(this.limit)
      console.log('loaded repos')
      if (repos.length === 0) {
        console.log('Repositories not found!')
        process.exit(1)
      }

      const promises = []
      for (const repo of repos) {
        promises.push(GithubService.importRepository(octokit, repo))
        await this.delayPromise(this.delay)
      }

      const repoNames = await Promise.all(promises)
        .then(values => values)
        .catch(erro => {
          console.log(erro.message)
        })

      console.log(repoNames)

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
  .option('-l, --limit <limit>', 'Quantity of repositories to explrorer')
  .option('-s, --skip <skip>', 'Amount of records to skip')
  .option('-d, --delay <delay>', 'Delay between github calls in ms.')

program.parse(process.argv)

const options = program.opts()

const importRepository = new ImportRepository(options)
importRepository.run()
