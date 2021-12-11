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
  private sonarService: SonarService

  public async run (options: any) {
    const octokit = await GithubService.getOctokit()

    this.sonarService = new SonarService()

    const projectUUIDs = await this.sonarService.getAllProjectsUUID()
    console.log('qty-projects', projectUUIDs.length)
    let i = 0

    const promises = []
    const promisesQuerable = []
    // let projectUUIDsFilter = []
    for (const projectUUID of projectUUIDs) {
      // projectUUIDsFilter.push(projectUUID)
      const promise = this.getProjectMeasures(projectUUID, i)
      promises.push(promise)
      promisesQuerable.push(this.MakeQuerablePromise(promise))

      console.log('project-uuid', projectUUID, i++)

      if ((i % 10) === 0) {
        // console.log('filter', projectUUIDsFilter.join("', '"))
        // projectUUIDsFilter = []

        let n = 0
        do {
          n = this.countPendingPromises(promisesQuerable)
          // console.log('n', n)
          await this.delay(500)
        } while (n > 20)
      }

      if (i > 1000) break
    }

    const rows: Array<any> = []
    await Promise.all(promises)
      .then(responses => {
        console.log('formating responses')
        for (const response of responses) {
          for (const item of response) {
            rows.push(item)
          }
        }
      })
      .catch(erro => {
        console.log(erro.message)
      })

    console.log('rows.length', rows.length)

    console.log('create-csv-object')
    const csv = new ObjectsToCsv(rows)
    console.log('csv-object-created')

    console.log('writing')
    await csv.toDisk('./files-stats.csv')
    console.log('wrote')

    process.exit(0)
  }

  private async getProjectMeasures (projectUUID, i): Promise<any> {
    const measures = await this.sonarService.getFilesOverallMeasuresByProjectUUID(projectUUID)

    const rows = []
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

    console.log('FINISH', i)

    return rows
  }

  private delay (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private countPendingPromises (promisesQuerable) {
    let i = 1
    for (const p of promisesQuerable) {
      if (p.isPending() === true) i++
    }
    return i
  }

  private MakeQuerablePromise (promise) {
    // Don't modify any promise that has been already modified.
    if (promise.isFulfilled) return promise

    // Set initial state
    let isPending = true
    let isRejected = false
    let isFulfilled = false

    // Observe the promise, saving the fulfillment in a closure scope.
    const result = promise.then(
      function (v) {
        isFulfilled = true
        isPending = false
        return v
      },
      function (e) {
        isRejected = true
        isPending = false
        throw e
      }
    )

    result.isFulfilled = function () { return isFulfilled }
    result.isPending = function () { return isPending }
    result.isRejected = function () { return isRejected }
    return result
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
