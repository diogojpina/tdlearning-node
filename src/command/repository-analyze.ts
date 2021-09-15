import { Command } from 'commander'
import mongoose from 'mongoose'

import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git'

import urljoin from 'url-join'

import fs from 'fs'
import util from 'util'

import path from 'path'
import { config } from 'dotenv'

import { Repository } from '../model/Repository'
import { RepositoryTag } from '../model/RepositoryTag'
config({ path: path.join(__dirname, '../.env') })

const exec = util.promisify(require('child_process').exec)

class RepositoryAnalyzer {
  public path = '';

  public constructor (options) {
    this.path = options.path
  }

  public async run (projectUrl: string, projectName: string) {
    await this.connectMongo()

    const fullName = 'apache/maven'
    const repo = await Repository.findOne({ full_name: fullName })
    if (repo === null) {
      console.log(`Repo ${fullName} not found!`)
      process.exit(1)
    }

    const projectPath = urljoin(this.path, projectName)

    if (fs.existsSync(projectPath) === false) {
      await simpleGit().clone(projectUrl, projectPath)
    }

    const gitOptions: Partial<SimpleGitOptions> = {
      baseDir: projectPath,
      binary: 'git',
      maxConcurrentProcesses: 6
    }

    try {
      const git: SimpleGit = simpleGit(gitOptions)
        .outputHandler((bin, stdout, stderr, args) => {
          stdout.pipe(process.stdout)
          stderr.pipe(process.stderr)
        })

      const tags = await git.tags()

      for (const tag of tags.all) {
        let repositoryTag: any = await RepositoryTag.findOne({ tag, repository: repo._id })
        if (repositoryTag === null) {
          repositoryTag = new RepositoryTag({
            tag,
            repository: repo,
            analized: 0
          })
          await RepositoryTag.collection.insertOne(repositoryTag)
        }

        if (repositoryTag.analyzed !== 2) continue // skip analyzed tags (success true/false)

        // if (tag !== 'maven-3.3.9') continue

        await git.checkout(tag)

        const analyzeSuccess = await this.analyze({
          path: projectPath,
          name: projectName,
          tag
        })

        await RepositoryTag.updateOne({ _id: repositoryTag._id }, { analyzed: analyzeSuccess === true ? 1 : 2 })
      }
    } catch (e) {
      console.log('error', e)
    }

    process.exit(1)
  }

  private async analyze (repo): Promise<boolean> {
    repo.fullName = (`${repo.name}-${repo.tag}`).replace('/', ':')

    let args = ` -Dsonar.projectKey=${repo.fullName}`
    args += ` -Dsonar.projectName=${repo.name}`
    args += ` -Dsonar.projectBaseDir=${repo.path}`

    const success = await this.runMavenDocker(repo, args)
    return success
  }

  private async runMaven (repo, args:string): Promise<boolean> {
    const pomFile = path.join(repo.path, 'pom.xml')
    if (fs.existsSync(pomFile) === false) {
      console.log('It is not a Maven project')
      return false
    }

    let command = `${process.env.MAVEN_PATH} clean verify`
    command += ` -f ${pomFile} sonar:sonar `
    command += args
    command += ' -Drat.skip=true'

    if (process.env.MAVEN_SKIPTESTS === 'true') {
      command += ' -DskipTests=true'
    }
    command += ' -Dsonar.login=admin'
    command += ' -Dsonar.password=admin'
    command += ' -Dsonar.host.url=http://127.0.0.1:9000'
    console.log(`Trying Maven on path ${repo.fullName}`)

    console.log('command', command)

    try {
      const { stdout, stderr } = await exec(command)
      // console.log('stdout', stdout);
      return true
    } catch (e) {
      console.log('error', e)
      return false
    }
  }

  private async runMavenDocker (repo, args:string): Promise<boolean> {
    const pomFile = path.join(repo.path, 'pom.xml')
    if (fs.existsSync(pomFile) === false) {
      console.log('It is not a Maven project')
      return false
    }

    let command = 'docker run -t --rm --name my-maven-project --net=sonarqube80_sonarqube-network'
    command += ` -v ${repo.path}:/usr/src/mymaven`
    command += ' -v /projects/technicaldebt/sonar/maven/m2:/root/.m2'
    command += ' -w /usr/src/mymaven maven:3.3-jdk-8 mvn clean verify sonar:sonar'

    command += ` -Dsonar.projectKey=${repo.fullName}`
    command += ` -Dsonar.projectName=${repo.name}`

    command += ' -Drat.skip=true'

    if (process.env.MAVEN_SKIPTESTS === 'true') {
      command += ' -DskipTests=true'
    }
    command += ' -Dsonar.login=admin'
    command += ' -Dsonar.password=admin'
    command += ' -Dsonar.host.url=http://172.18.0.3:9000'
    console.log(`Trying Maven on path ${repo.fullName}`)

    console.log('command', command)

    try {
      const { stdout, stderr } = await exec(command)
      // console.log('stdout', stdout);
      return true
    } catch (e) {
      console.log('error', e)
      return false
    }
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
  .option('-p, --path <path>', 'git path')
  .option('-u, --url <url>', 'git URL to clone')
  .option('-n, --project-name <name>', 'project name')

program.parse(process.argv)

const options = program.opts()

const repositoryAnalyzer = new RepositoryAnalyzer(options)
repositoryAnalyzer.run(options.url, options.projectName)
