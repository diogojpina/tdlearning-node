"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _GithubService = require('../services/GithubService');
var _Repository = require('../model/Repository');
var _User = require('../model/User');

class GithubController {
   async importRepository (req, res) {
    const count = await _Repository.Repository.find({status: 0}).countDocuments();    
    const skip = Math.floor(Math.random() * count);
    let repos = await _Repository.Repository.find({status: 0}).skip(skip).limit(50);    
    if (repos.length === 0) {
      return res.json({error: true, message: 'Repositories not found!'});
    }

    const octokit = await _GithubService.GithubService.getOctokit();
    const rates = await _GithubService.GithubService.getRates(octokit);
    console.log(rates)
    if (rates.remaining < 100) {
      return res.json({error: true, message: rates});
    }    
    
    const promises = []
    for (const repo of repos) {
      promises.push(_GithubService.GithubService.importRepository(octokit, repo))
    }

    const repoNames = await Promise.all(promises)
      .then(values => values)
      .catch(erro => {
        console.log(erro.message)
    });

    return res.json({data: repoNames});    
  }

   async importUser (req, res) {
    const count = await _User.User.find({status: 0}).countDocuments();    
    const skip = Math.floor(Math.random() * count);
    let users = await _User.User.find({status: 0}).skip(skip).limit(50);    
    if (users.length === 0) {
      return res.json({error: true, message: 'Users not found!'});
    }

    const octokit = await _GithubService.GithubService.getOctokit();
    const rates = await _GithubService.GithubService.getRates(octokit);
    console.log(rates)
    if (rates.remaining < 100) {
      return res.json({error: true, message: "Low github rates"});
    }

    const promises = []
    for (const user of users) {
      promises.push(_GithubService.GithubService.importUser(octokit, user))
      
    }

    const userLogins = await Promise.all(promises)
      .then(values => values)
      .catch(erro => {
        console.log(erro.message)
    });
    
    return res.json({data: userLogins});    
  }

   async importOrganization (req, res) {
    const count = await _User.User.find({status: 0}).countDocuments();    
    const skip = Math.floor(Math.random() * count);
    const organizations = await _User.User.find({status: 0}).skip(skip).limit(100);    
    if (organizations.length === 0) {
      return res.json({error: true, message: 'Organizations not found!'});
    }

    const octokit = await _GithubService.GithubService.getOctokit();
    const rates = await _GithubService.GithubService.getRates(octokit);
    console.log(rates)
    if (rates.remaining < 100) {
      return res.json({error: true, message: "Low github rates"});
    }

    const promises = []
    for (const organization of organizations) {
      promises.push(_GithubService.GithubService.importOrganization(octokit, organization))      
    }

    const organizationLogins = await Promise.all(promises)
      .then(values => values)
      .catch(erro => {
        console.log(erro.message)
    });
    
    return res.json({data: organizationLogins});
  }
}

exports. default = new GithubController()
