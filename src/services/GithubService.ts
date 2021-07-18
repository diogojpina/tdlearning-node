import { createOAuthAppAuth } from '@octokit/auth-oauth-app'
import { Octokit } from '@octokit/rest'
import { Organization } from '../model/Organization'
import { Repository } from '../model/Repository'
import { User } from '../model/User'

export class GithubService {
  public static async getOctokit (): Octokit {
    const credentials = JSON.parse(process.env.GITHUB_CREDENTIALS)
    const index = Math.floor(Math.random() * credentials.length)

    const { clientId, clientSecret } = credentials[index]
    console.log('clientId', clientId)
    console.log('clientSecret', clientSecret)
    const appOctokit = new Octokit({
      authStrategy: createOAuthAppAuth,
      auth: {
        clientId,
        clientSecret
      }
    })

    return appOctokit
  }

  public static getRepositoryOwnerAndName (fullName: string): any {
    const arr = fullName.split('/')
    const data = { owner: '', repoName: '' }
    if (arr.length >= 2) {
      data.owner = arr[0]
      data.repoName = arr[1]
    }

    return data
  }

  public static async getRates (octokit: Octokit) {
    return (await octokit.rateLimit.get()).data.rate
  }

  public static async importRepository (octokit: Octokit, repo) {
    const { owner, repoName } = GithubService.getRepositoryOwnerAndName(repo.full_name)

    console.log('full_name', `${owner}/${repoName}`)

    let repoResponse
    try {
      repoResponse = await octokit.repos.get({ owner, repo: repoName })
    } catch (error) {
      if (error.status === 404) {
        await Repository.updateOne({ id: repo.id }, { private: true, status: 1 })
        return `Repo ${owner}/${repoName} not found`
      }
      return false
    }

    if (repoResponse.status === 200) {
      await Repository.updateOne({ id: repo.id }, { ...repoResponse.data, status: 1 })

      if (repoResponse.data.owner.type == 'Organization') {
        const organization = await Organization.findOne({ login: repoResponse.data.owner.login }).exec()
        if (organization === null) {
          await Organization.collection.insertOne(repoResponse.data.owner)
        }
      }

      const contributorsResponse = await octokit.repos.listContributors({ owner, repo: repoName, per_page: 100 })

      if (contributorsResponse.status === 200) {
        const users = []
        for (const contributorData of contributorsResponse.data) {
          const user = await User.findOne({ login: contributorData.login }).exec()
          if (user === null) {
            users.push(new User(contributorData))
          }
        }
        await User.insertMany(users)
      }

      return repo.full_name
    }
    return false
  }

  public static async importContributors (octokit, repo) {
    const { owner, repoName } = GithubService.getRepositoryOwnerAndName(repo.full_name)

    console.log('repo-full-name:', `${owner}/${repoName}`)

    const contributorsResponse = await octokit.repos.listContributors({ owner, repo: repoName, per_page: 100 })

    if (contributorsResponse.status === 200) {
      const users = []
      for (const contributorData of contributorsResponse.data) {
        const user = await User.findOne({ login: contributorData.login })
        if (user !== null) {
          users.push({ user, status: 0 })
        } else {
          const newUser = new User(contributorData)
          await User.collection.insertOne(newUser)
          users.push({ user: newUser, status: 0 })
        }
      }
      await Repository.updateOne({ _id: repo._id }, { contributors: users })
    }
  }

  public static async importUser (octokit, user) {
    const userResponse = await octokit.users.getByUsername({ username: user.login })
    if (userResponse.status === 200 && user.login === userResponse.data.login) {
      await User.updateOne({ login: user.login }, { ...userResponse.data, status: 1 })

      const reposResponse = await octokit.repos.listForUser({ username: user.login, per_page: 100 })

      const repos = []
      for (const repoData of reposResponse.data) {
        const repo = await Repository.findOne({ id: repoData.id }).exec()
        if (repo === null) {
          repos.push(new Repository(repoData))
        }
      }
      await Repository.insertMany(repos)

      const orgsResponse = await octokit.orgs.listForUser({ username: user.login, per_page: 100 })

      const orgs = []
      for (const orgData of orgsResponse.data) {
        const org = await Organization.findOne({ login: orgData.login }).exec()
        if (org === null) {
          orgs.push(new Organization(orgData))
        }
      }
      Organization.insertMany(orgs)

      return user.login
    }
    return false
  }

  public static async importOrganization (octokit: Octokit, organization) {
    console.log(organization)
    const orgResponse = await octokit.orgs.get({ org: organization.id })
    // get({org: organization.id})
    console.log(orgResponse)
  }
}
