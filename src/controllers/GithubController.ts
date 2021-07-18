import { Request, Response } from 'express'

import { GithubService } from '../services/GithubService'
import { Repository } from '../model/Repository'
import { User } from '../model/User'

class GithubController {
  public async importRepository (req: Request, res: Response): Promise<Response> {
    const octokit = await GithubService.getOctokit()
    const rates = await GithubService.getRates(octokit)
    console.log(rates)
    if (rates.remaining < 100) {
      return res.json({ error: true, message: rates })
    }

    console.log('counting')
    // const count = await Repository.find({status: 0}).countDocuments();
    const count = 20000000
    const skip = Math.floor(Math.random() * count)
    console.log('skip', skip)
    const repos = await Repository.find({ status: 0 }).skip(skip).limit(50)
    console.log('loaded repos')
    if (repos.length === 0) {
      return res.json({ error: true, message: 'Repositories not found!' })
    }

    const promises = []
    for (const repo of repos) {
      promises.push(GithubService.importRepository(octokit, repo))
    }

    const repoNames = await Promise.all(promises)
      .then(values => values)
      .catch(erro => {
        console.log(erro.message)
      })

    return res.json({ data: repoNames })
  }

  public async importUser (req: Request, res: Response): Promise<Response> {
    const octokit = await GithubService.getOctokit()
    const rates = await GithubService.getRates(octokit)
    console.log(rates)
    if (rates.remaining < 100) {
      return res.json({ error: true, message: 'Low github rates' })
    }

    // const count = await User.find({ status: 0 }).countDocuments()
    const count = 1000000
    const skip = Math.floor(Math.random() * count)
    const users = await User.find({ status: 0 }).skip(skip).limit(50)
    if (users.length === 0) {
      return res.json({ error: true, message: 'Users not found!' })
    }

    const promises = []
    for (const user of users) {
      promises.push(GithubService.importUser(octokit, user))
    }

    const userLogins = await Promise.all(promises)
      .then(values => values)
      .catch(erro => {
        console.log(erro.message)
      })

    return res.json({ data: userLogins })
  }

  public async importOrganization (req: Request, res: Response): Promise<Response> {
    const count = await User.find({ status: 0 }).countDocuments()
    const skip = Math.floor(Math.random() * count)
    const organizations = await User.find({ status: 0 }).skip(skip).limit(100)
    if (organizations.length === 0) {
      return res.json({ error: true, message: 'Organizations not found!' })
    }

    const octokit = await GithubService.getOctokit()
    const rates = await GithubService.getRates(octokit)
    console.log(rates)
    if (rates.remaining < 100) {
      return res.json({ error: true, message: 'Low github rates' })
    }

    const promises = []
    for (const organization of organizations) {
      promises.push(GithubService.importOrganization(octokit, organization))
    }

    const organizationLogins = await Promise.all(promises)
      .then(values => values)
      .catch(erro => {
        console.log(erro.message)
      })

    return res.json({ data: organizationLogins })
  }
}

export default new GithubController()
