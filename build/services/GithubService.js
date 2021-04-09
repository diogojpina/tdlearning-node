"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _authoauthapp = require('@octokit/auth-oauth-app');
var _rest = require('@octokit/rest');
var _Organization = require('../model/Organization');
var _Repository = require('../model/Repository');
var _User = require('../model/User');

 class GithubService {
   static async getOctokit() {
    const credentials = JSON.parse(process.env.GITHUB_CREDENTIALS);
    const index = Math.floor(Math.random() * credentials.length);
    
    const { clientId, clientSecret } = credentials[index];
    const appOctokit = new (0, _rest.Octokit)({
      authStrategy: _authoauthapp.createOAuthAppAuth,
      auth: {
        clientId,
        clientSecret
      }
    });

    return appOctokit;
  }

     static getRepositoryOwnerAndName(fullName) {
      const arr = fullName.split('/');
      const data = { owner: '', repoName: ''}
      if (arr.length >= 2) {
        data.owner = arr[0]
        data.repoName = arr[1]
      }

      return data
    }

   static async getRates(octokit) {
    return (await octokit.rateLimit.get()).data.rate
  }

   static async importRepository(octokit, repo) {            
    const { owner, repoName } = GithubService.getRepositoryOwnerAndName(repo.full_name)

    const repoResponse = await octokit.repos.get({owner, repo: repoName});

    if (repoResponse.status === 200) {  
      await _Repository.Repository.updateOne({id: repo.id}, {...repoResponse.data, status: 1});

      if (repoResponse.data.owner.type == 'Organization') {
        const organization = await _Organization.Organization.findOne({login: repoResponse.data.owner.login}).exec();
        if (organization === null) {
          await _Organization.Organization.collection.insertOne(repoResponse.data.owner);
        }
      }
      
      const contributorsResponse = await octokit.repos.listContributors({owner, repo:repoName, per_page: 100});

      if (contributorsResponse.status === 200) {
        const users = [];
        for (const contributorData of contributorsResponse.data) {
          let user = await _User.User.findOne({login: contributorData.login}).exec();
          if (user === null) {
            users.push(new (0, _User.User)(contributorData));
          } 
        }
        await _User.User.insertMany(users);
      }
      

           
      return repo.full_name
    }
    return false
  }

   static async importUser(octokit, user) {
    const userResponse = await octokit.users.getByUsername({username: user.login});
    if (userResponse.status === 200 && user.login === userResponse.data.login) {
      await _User.User.updateOne({login: user.login}, {...userResponse.data, status: 1});
      
      const reposResponse = await octokit.repos.listForUser({username: user.login, per_page: 100});

      const repos = [];
      for (const repoData of reposResponse.data) {
        const repo = await _Repository.Repository.findOne({id: repoData.id}).exec();
        if (repo === null) {          
          repos.push(new (0, _Repository.Repository)(repoData));
        } 
      }
      await _Repository.Repository.insertMany(repos);

      const orgsResponse = await octokit.orgs.listForUser({username: user.login, per_page: 100});

      const orgs = [];
      for (const orgData of orgsResponse.data) {
        const org = await _Organization.Organization.findOne({login: orgData.login}).exec();
        if (org === null) {
          orgs.push(new (0, _Organization.Organization)(orgData));
        } 
      }
      _Organization.Organization.insertMany(orgs);
      
      return user.login
    }
    return false
  }

   static async importOrganization(octokit, organization) {
    console.log(organization);
    const orgResponse = await octokit.orgs.get({ org: organization.id })
    // get({org: organization.id})
    console.log(orgResponse)
  }


} exports.GithubService = GithubService;