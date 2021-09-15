import { Command } from 'commander'
import mongoose from 'mongoose'
import fs from 'fs'
import util from 'util'

import path from 'path'
import { config } from 'dotenv'

import { Repository } from '../model/Repository'

import * as child from 'child_process'
const exec = util.promisify(require('child_process').exec)

config({ path: path.join(__dirname, '../.env') })
class SonarAnalyzer {
    public path = '';
    public scanners = new Map();
    public arguments = '';

    public constructor (options) {
      this.path = options.path

      this.scanners.set('Java', [
        this.runMaven,
        this.runGradle,
        this.runAnt
      ])

      this.scanners.set('other', [
        this.runSonarScanner
      ])
    }

    public async run () {
      try {
        // const repos = await Repository.find({ status: 1, analyzed: 0, forks_count: { $gte: 1000 } }).limit(10)

        console.log('counting')
        // const count = await Repository.find({ status: 1, analyzed: 0, language: 'Java' }).countDocuments();
        const skip = options.skip ? Math.random() * parseInt(options.skip) : 1000000
        const limit = options.limit ? parseInt(options.limit) : 10
        console.log('finding repos')
        const repos = await Repository.find({ status: 1, analyzed: 0, language: 'Java' }).skip(skip).limit(limit)
        // const repos = await Repository.find({ status: 1, analyzed: 0 }).skip(skip).limit(limit)
        // const repos = await Repository.find({ status: 1, analyzed: 0, full_name: 'ryantenney/spring-security' })
        console.log('repos found')

        // TODO: update analyzed
        await this.updateAnalyzed(repos, 2)

        const promises = []
        for (const repo of repos) {
          await this.analyze(repo)
          // promises.push(this.analyze(repo));
          // await delay(500);
        }

        // await Promise.all(promises).then(valores=> {
        //   console.log(valores); // [3, 1337, "foo"]
        // });
      } catch (e) {
        console.log('error', e)
      }

      process.exit(1)
    }

    private async analyze (repo) {
      repo.projectPath = `${this.path}/${repo.name}`
      repo.cloneUrl = `https://github.com/${repo.full_name}.git`
      repo.fullName = repo.full_name.replace('/', ':')

      this.arguments = ` -Dsonar.projectKey=${repo.fullName}`
      this.arguments += ` -Dsonar.projectName=${repo.name}`
      this.arguments += ` -Dsonar.projectBaseDir=${repo.projectPath}`

      await this.clean(repo.projectPath)

      try {
        await this.clone(repo.cloneUrl, repo.projectPath)
      } catch (e) {
        console.log(`It was not possible clone ${repo.full_name}`)
        return false
      }

      for (const scanner of this.getScanners(repo.language)) {
        const success = await scanner(repo, this.arguments)
        if (success === true) {
          repo.analyzed = 1
          await repo.save()
          await this.clean(repo.projectPath)
          return true
        }
      }

      repo.analyzed = 3
      await repo.save()

      await this.clean(repo.projectPath)
      return false
    }

    private async clean (path: string) {
      const command = `rm -Rf ${path}`
      const { stdout, stderr } = await exec(command)
    }

    private async clone (url:string, path: string) {
      console.log(`Cloning ${url}`)
      const command = `git clone ${url} ${path}`

      const { stdout, stderr } = await exec(command)
    }

    private async runMSBuild (repo, args:string) {
      console.log(`msbuild on path ${repo.projectPath}`)
      return false
    }

    private async runMaven (repo, args:string) {
      const pomFile = path.join(repo.projectPath, 'pom.xml')
      if (fs.existsSync(pomFile) === false) {
        console.log('It is not a Maven project')
        return false
      }

      await Repository.updateOne({ _id: repo._id }, { builder: 'maven' })

      console.log(`Trying Maven on path ${repo.full_name}`)

      let command = `${process.env.MAVEN_PATH} clean verify`
      command += ` -f ${pomFile} 'sonar:sonar' `
      command += args

      if (process.env.MAVEN_SKIPTESTS === 'true') {
        command += ' -DskipTests=true'
      }
      command += ' -Drat.skip=true'

      if (process.env.MAVEN_LOGIN) {
        command += ` -Dsonar.login=${process.env.MAVEN_LOGIN}`
      }

      if (process.env.MAVEN_PASSWORD) {
        command += ` -Dsonar.password=${process.env.MAVEN_PASSWORD}`
      }

      if (process.env.MAVEN_URL) {
        command += ` -Dsonar.host.url=${process.env.MAVEN_URL}`
      }

      console.log('maven-command', command)

      try {
        const { stdout, stderr } = await exec(command)
        // console.log('stdout', stdout);
        return true
      } catch (e) {
        // console.log('error', e);
        return false
      }
    }

    private async runGradle (repo, args: string) {
      const buildFile = path.join(repo.projectPath, 'build.gradle')
      if (fs.existsSync(buildFile) === false) {
        console.log('It is not a Gradle project')
        return false
      }

      await Repository.updateOne({ _id: repo._id }, { builder: 'gradle' })

      console.log(`Trying Gradle on ${repo.full_name}`)

      let command = `${process.env.GRADLE_PATH} build --build-file ${buildFile}`
      try {
        const { stdout, stderr } = await exec(command)
      } catch (e) {
        // console.log('error', e);
        return false
      }

      command = `${process.env.SCANNER_PATH} -Dsonar.login=${process.env.SONAR_LOGIN} -Dsonar.password=${process.env.SONAR_PASS} -Dsonar.sources=src -Dsonar.java.binaries=target ${args}`
      try {
        const { stdout, stderr } = await exec(command)
        return true
      } catch (e) {
        // console.log('error', e);
        return false
      }
    }

    private async runAnt (repo, args: string) {
      const buildFile = path.join(repo.projectPath, 'build.xml')
      if (fs.existsSync(buildFile) === false) {
        console.log('It is not an Ant project')
        return false
      }

      await Repository.updateOne({ _id: repo._id }, { builder: 'ant' })

      console.log(`Trying Ant on path ${repo.name}`)

      let command = `${process.env.GRADLE_PATH} build -build-file ${buildFile}`
      try {
        const { stdout, stderr } = await exec(command)
      } catch (e) {
        // console.log('error', e);
        return false
      }

      command = `${process.env.SCANNER_PATH} -Dsonar.login=${process.env.SONAR_LOGIN} -Dsonar.password=${process.env.SONAR_PASS} -Dsonar.sources=src -Dsonar.java.binaries=target ${args}`
      try {
        const { stdout, stderr } = await exec(command)
        return true
      } catch (e) {
        // console.log('error', e);
        return false
      }
    }

    private async runSonarScanner (repo, args: string) {
      console.log(`sonar-scanner on path ${repo.name}`)

      const command = `${process.env.SCANNER_PATH} ${args}`
      try {
        const { stdout, stderr } = await exec(command)
        return true
      } catch (e) {
        // console.log('error', e);
        return false
      }
    }

    private getScanners (language: string): any {
      let scanners = this.scanners.get(language)
      if (scanners === undefined) {
        scanners = this.scanners.get('other')
      }
      return scanners
    }

    private async updateAnalyzed (repos: any, analyzed: number) {
      for (const repo of repos) {
        repo.analyzed = analyzed
        await repo.save()
      }
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
  .option('-p, --path <path>', 'git path')
  .option('-s, --skip <skip>', 'Amount of records to skip')
  .option('-l, --limit <limit>', 'Quantity of repositories to explrorer')

program.parse(process.argv)

const options = program.opts()

const sonarAnalyzer = new SonarAnalyzer(options)
sonarAnalyzer.run()
