import { Command } from 'commander'
import mongoose from 'mongoose'

import { Repository } from '../../model/Repository'

import { GithubService } from '../../services/GithubService'
import { SonarService } from '../../services/SonarService'

import path from 'path'
import { config } from 'dotenv'

import * as csv from 'fast-csv'
import fs from 'fs'

config({ path: path.join(__dirname, '../../.env') })

class Augmentation {
  public async run (options: any) {
    const octokit = await GithubService.getOctokit()

    const sonarService: SonarService = new SonarService()

    await this.connectMongo()

    const labelsMap: Map<string, number> = new Map<string, number>()
    const filesByLabel: Map<number, string[]> = new Map<number, string[]>()
    const results = []
    let i = 0
    fs.createReadStream('/projects/technicaldebt/tdlearning-node/csv/cluster.csv')
      .pipe(csv.parse({ headers: true, delimiter: ',' }))
      // .on('data', (data) => results.push(data))
      .on('error', error => console.error(error))
      .on('data', (row) => {
        i++
        const label = parseInt(row.label)
        const longName = row.long_name
        if (labelsMap.has(longName) === false) {
          labelsMap.set(longName, label)
        }

        if (filesByLabel.has(label)) {
          const longNames = filesByLabel.get(label)
          // console.log(longNames)
          // console.log(longName)
          // console.log(longNames.filter((value) => value !== longName).length)
          // console.log('index', longNames.indexOf(longName))
          if (longNames.indexOf(longName) === -1) {
            longNames.push(longName)
            filesByLabel.set(label, longNames)
          }
        } else {
          filesByLabel.set(label, [longName])
        }
      })
      // .on('headers', (headers) => {
      //   console.log(`First header: ${headers[0]}`)
      // })
      .on('end', () => {
        let i = 1
        for (const label of filesByLabel.keys()) {
          if (label >= 0) {
            const longNames = filesByLabel.get(label)
            if (longNames.length > 1) {
              // console.log(longNames)
              i++
            }
          }
        }

        console.log(i)
        console.log(filesByLabel.get(-1).length)
        console.log('labels quantity', filesByLabel.size)
        console.log('unique files quantity', labelsMap.size)
        console.log(i)

        // console.log(results)
        process.exit(0)
      })
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

const augmentation = new Augmentation()
augmentation.run(options)
