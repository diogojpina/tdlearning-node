import { Command } from 'commander'
import mongoose from 'mongoose'

import path from 'path'
import { config } from 'dotenv'

import { SonarService } from '../../services/SonarService'
import { Repository } from '../../model/Repository'
import { RepositoryTag } from '../../model/RepositoryTag'
config({ path: path.join(__dirname, '../../.env') })

class TechnicalDebtDiffs {
  private sonarService: SonarService = new SonarService()

  public async run (fullName: string) {
    await this.connectMongo()

    // const tag1 = 'maven-maven-3.0'
    // const tag2 = 'maven-maven-3.8.2'

    const repo = await Repository.findOne({ full_name: fullName })
    const tags: any = await RepositoryTag.find({ repository: repo._id })

    let total = 0

    let tag1 = null
    for (const tag2 of tags) {
      if (tag2.analyzed !== 1) continue

      if (tag1 === null) {
        tag1 = tag2
        continue
      }

      const tds = await this.analyzeTags(repo.name, tag1.tag, tag2.tag)
      // for (const [file, td] of tds) {
      //   console.log('td', td)
      // }
      console.log(tds)
      total += tds.length
      console.log('total', total)

      tag1 = tag2
    }

    console.log('total', total)

    process.exit(0)
  }

  private async analyzeTags (repoName: string, tag1: string, tag2: string) {
    const projectKee1 = `${repoName}-${tag1}`
    const projectKee2 = `${repoName}-${tag2}`
    console.log('tag', tag1, tag2)
    // console.log('kees', projectKee1, projectKee2)

    const measures1 = await this.sonarService.getProjectMeasures(projectKee1)
    const measures2 = await this.sonarService.getProjectMeasures(projectKee2)

    const tdsResult1 = await this.sonarService.getProjectTDs(projectKee1)
    const tdsResult2 = await this.sonarService.getProjectTDs(projectKee2)

    const td1Map = this.groupTDs(tdsResult1.rows)
    const td2Map = this.groupTDs(tdsResult2.rows)

    const rows = []

    for (const [fileId1, file1Map] of td1Map) {
      if (td2Map.has(fileId1) === false) continue

      const file2Map = td2Map.get(fileId1)

      for (const [ruleId, tds1] of file1Map) {
        let tdDiff = 0
        if (file2Map.has(ruleId) === true) {
          const tds2 = file2Map.get(ruleId)

          tdDiff = tds1.length - tds2.length
          // console.log('td2-count', tds2.length)
          // console.log('td1-count', tds1.length)
          // console.log('diff', tdDiff)
          if (tdDiff <= 0) continue
          // console.log('td1', tds1.length)
        } else {
          tdDiff = tds1.length
        }

        for (let i = 0; i < tdDiff; i++) {
          rows.push(fileId1)
        }
      }

      if (file2Map.size >= file1Map.size) continue

      const fileMeasures1 = measures1.get(fileId1)
      const fileMeasures2 = measures2.get(fileId1)

      // console.log(fileId1)
      // console.log(file1Map.size)
      // console.log(file2Map.size)

      const variables1 = this.sonarService.formatMeasures(fileMeasures1)
      variables1.push({
        key: 'paid',
        value: file1Map.size - file2Map.size
      })

      console.log('VARS', variables1.length)

      // console.log('variables1', variables1)

      const variables2 = this.sonarService.formatMeasures(fileMeasures2)
      // console.log('variables2', variables2)
    }

    return rows
  }

  private groupTDs (tds): Map<string, Map<string, any[]>> {
    const tdMap = new Map<string, Map<string, any[]>>()
    for (const td of tds) {
      // console.log('td2', td2)
      const file = td.long_name
      const ruleId = td.rule_id
      if (tdMap.has(file) === false) {
        tdMap.set(file, new Map<string, any[]>())
      }

      const fileMap = tdMap.get(file)

      if (fileMap.has(ruleId) === false) {
        fileMap.set(ruleId, [])
      }

      fileMap.get(ruleId).push(td)
    }

    return tdMap
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
  .option('-n, --repo-name <name>', 'repository name')
program.parse(process.argv)

const options = program.opts()

const technicalDebtDiffs = new TechnicalDebtDiffs()
technicalDebtDiffs.run(options.repoName)
