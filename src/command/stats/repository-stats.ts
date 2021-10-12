import { Command } from 'commander'
import mongoose from 'mongoose'

import { Repository } from '../../model/Repository'

import { GithubService } from '../../services/GithubService'
import { SonarService } from '../../services/SonarService'

import { createArrayCsvWriter } from 'csv-writer'
import ObjectsToCsv from 'objects-to-csv'

import path from 'path'
import { config } from 'dotenv'

config({ path: path.join(__dirname, '../../.env') })

class RepositoryStats {
  public async run (options: any) {
    const octokit = await GithubService.getOctokit()

    const sonarService: SonarService = new SonarService()

    await this.connectMongo()

    const limit = options.limit ? parseInt(options.limit) : 10
    const filter: any = { status: 1, analyzed: { $ne: 0 } }
    // const filter: any = { full_name: 'apache/maven' }
    if (options.language) {
      filter.language = options.language
    }

    console.log('listing repos')
    const repos = await Repository.find(filter).limit(limit)
    console.log('repos_count', repos.length)

    const rows = []
    for (const repo of repos) {
      console.log('repo.full_name', repo.full_name)

      const projectKee = repo.full_name.replace('/', ':')
      // const projectKee = 'maven-maven-3.3.8'
      console.log('collecting_metrics')
      const measures = await sonarService.getProjectOverallMeasures(projectKee)
      console.log('metrics_count', measures.rowCount)
      if (measures.rowCount === 0) continue

      console.log('collecting_tds_stats')
      const tdStats = await sonarService.getProjectTDsStats(projectKee)
      console.log('collected_tds_stats')

      const now = new Date()
      const createdAt = new Date(repo.created_at)
      const diffTime = now - createdAt
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const updatedAt = new Date(repo.updated_at)
      const diffUpdateTime = now - updatedAt
      const diffUpdateDays = Math.ceil(diffUpdateTime / (1000 * 60 * 60 * 24))

      const activeTime = updatedAt - createdAt
      const activeDays = Math.ceil(activeTime / (1000 * 60 * 60 * 24))

      const stats: any = {}
      stats.full_name = repo.full_name
      stats.language = repo.language
      stats.lifetime = diffDays
      stats.lastUpdate = diffUpdateDays
      stats.activeDays = activeDays
      stats.size = repo.size
      stats.fork = repo.fork
      stats.forks = repo.forks
      stats.stargazers_count = repo.stargazers_count
      stats.subscribers_count = repo.subscribers_count
      stats.watchers = repo.watchers
      stats.open_issues = repo.open_issues
      stats.network_count = repo.network_count
      stats.language = repo.language

      for (const measure of measures.rows) {
        stats[`measure_${measure.name}`] = parseInt(measure.value)
      }

      for (const idx in tdStats) {
        stats[`td_${idx}`] = tdStats[idx]
      }

      // console.log('STATS', stats)
      rows.push(stats)
    }

    console.log('create-csv-object')
    const csv = new ObjectsToCsv(rows)
    console.log('csv-object-created')

    console.log('writing')
    await csv.toDisk('./repository-stats.csv')
    console.log('wrote')

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
  .option('-lang, --language <language>', 'language')
  .option('-l, --limit <limit>', 'Quantity of repositories to explrorer')

program.parse(process.argv)

const options = program.opts()

const repositoryStats = new RepositoryStats()
repositoryStats.run(options)
