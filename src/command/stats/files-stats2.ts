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

class FilesStats {
  public async run (options: any) {
    const octokit = await GithubService.getOctokit()

    const sonarService: SonarService = new SonarService()

    const rows = []

    const projectUUIDs = await sonarService.getAllProjectsUUID()
    console.log('qty-projects', projectUUIDs.length)
    let i = 0;
    for (const projectUUID of projectUUIDs) {
      console.log('project-uuid', projectUUID, i++)
      const measures = await sonarService.getFilesOverallMeasuresByProjectUUID(projectUUID)

      let stats: any = {}
      let uuid = ''
      for (const measure of measures.rows) {
        if (uuid !== measure.uuid) {
          if (stats?.uuid) {
            if (stats.measure_lines !== undefined) {
              rows.push(stats)
            }

            stats = {}
          }

          uuid = measure.uuid
          stats.project_uuid = projectUUID
          stats.uuid = measure.uuid
          stats.long_name = measure.long_name
        }
        stats[`measure_${measure.name}`] = parseInt(measure.value)
      // console.log('measure', measure.uuid)
      }
      if (stats.measure_lines !== undefined) {
        rows.push(stats)
      }
    }

    console.log(rows.length)

    console.log('create-csv-object')
    const csv = new ObjectsToCsv(rows)
    console.log('csv-object-created')

    console.log('writing')
    await csv.toDisk('./files-stats.csv')
    console.log('wrote')

    process.exit(0)
  }
}

const program = new Command()
program.version('0.0.1')

program
  .option('-lang, --language <language>', 'language')
  .option('-l, --limit <limit>', 'Quantity of repositories to explrorer')

program.parse(process.argv)

const options = program.opts()

const fileStats = new FilesStats()
fileStats.run(options)
