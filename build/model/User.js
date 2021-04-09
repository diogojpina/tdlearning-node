"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mongoose = require('mongoose'); var _mongoose2 = _interopRequireDefault(_mongoose);



const UserSchema = new _mongoose2.default.Schema({
  login: {
    type: String,
    required: true,
    index: true
  },
  id: {
    type: String,
    required: true,
    index: true
  },
  node_id: {
    type: String,
    required: true,
    index: true
  },
  site_admin: {
    type: Boolean,
  },
  name: {
    type: String,
  },
  company: {
    type: String,
  },
  blog: {
    type: String,
  },
  location: {
    type: String,
  },
  email: {
    type: String,
    index: true
  },
  hireable: {
    type: Boolean,
  },
  bio: {
    type: String,
  },
  twitter_username: {
    type: String,
  },
  public_repos: {
    type: Number,
  },
  public_gists: {
    type: Number,
  },
  followers: {
    type: Number,
  },
  following: {
    type: Number,
  },
  created_at: {
    type: Date
  },
  updated_at: {
      type: Date
  },
  status: {
    type: Number,
    index: true,
    default: 0
  },
})

const User = _mongoose2.default.model('user', UserSchema, 'user')

exports.User = User; exports.UserSchema = UserSchema;
