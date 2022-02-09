import { Command } from 'commander'
import mongoose from 'mongoose'

import { Repository } from '../../model/Repository'

import { GithubService } from '../../services/GithubService'
import { SonarService } from '../../services/SonarService'

import { createArrayCsvWriter } from 'csv-writer'
import ObjectsToCsv from 'objects-to-csv'

import path from 'path'
import { config } from 'dotenv'
import { stat } from 'fs'

config({ path: path.join(__dirname, '../../.env') })

class TDStats {
  public async run (options: any) {
    const octokit = await GithubService.getOctokit()

    const sonarService: SonarService = new SonarService()

    const projects = await sonarService.getProjectsByKeeLike('maven-maven')

    const rows = []
    for (const project of projects) {
      console.log('project', project.kee)
      const tds = await sonarService.getTDByProjectUUID(project.uuid)
      for (const td of tds.rows) {
        // console.log('td', td)
        const measures = await sonarService.getFilesMeasuresByComponentUUID(td.component_uuid)
        // console.log('measures', measures)

        const row = Object.assign(td, measures)
        rows.push(row)
      }
    }

    console.log(rows.length)

    console.log('create-csv-object')
    const csv = new ObjectsToCsv(rows)
    console.log('csv-object-created')

    console.log('writing')
    await csv.toDisk('./csv/tds-stats.csv')
    console.log('wrote')

    process.exit(0)
  }
}

const program = new Command()
program.version('0.0.1')

program
  .option('-l, --limit <limit>', 'Quantity of repositories to explrorer')
  .option('-k, --kee <kee>', 'Project kee')

program.parse(process.argv)

const options = program.opts()

const tdStats = new TDStats()
tdStats.run(options)
