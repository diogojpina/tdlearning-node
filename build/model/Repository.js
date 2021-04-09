"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mongoose = require('mongoose'); var _mongoose2 = _interopRequireDefault(_mongoose);

const RepositorySchema = new _mongoose2.default.Schema({
    id: {
        type: Number,
        required: true,
        index: true
    },
    node_id: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true,
        index: true
    },
    private: {
        type: Boolean,
        required: true,
        index: true,
        default: false
    },
    description: {
        type: String
    },
    fork: {
        type: Boolean
    },
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    },
    pushed_at: {
        type: Date
    },
    homepage: {
        type: String
    },
    size: {
        type: Number
    },
    stargazers_count: {
        type: Number
    },
    watchers_count: {
        type: Number
    },
    language: {
        type: String,
        index: true
    },
    has_issues: {
        type: Boolean
    },
    has_projects: {
        type: Boolean
    },
    has_downloads: {
        type: Boolean
    },
    has_wiki: {
        type: Boolean
    },
    has_pages: {
        type: Boolean
    },
    forks_count: {
        type: Number
    },
    archived: {
        type: Boolean
    },
    disabled: {
        type: Boolean
    },
    open_issues_count: {
        type: Number
    },
    forks: {
        type: Number
    },
    open_issues: {
        type: Number
    },
    watchers: {
        type: Number
    },
    default_branch: {
        type: String
    },
    network_count: {
        type: Number
    },
    subscribers_count: {
        type: Number
    },
    status: {
        type: Number,
        index: true,
        default: 0
    },
    analyzed: {
        type: Number,
        index: true,
        default: 0
    },
    invited: {
        type: Number,
        index: true,
        default: 0
    }
});

const Repository = _mongoose2.default.model('repository', RepositorySchema, 'repository');

exports.Repository = Repository; exports.RepositorySchema = RepositorySchema;