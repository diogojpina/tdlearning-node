import mongoose from 'mongoose'
import { AttributeSchema } from './Attribute'
import { RoleSchema } from './Role'

const UserSchema = new mongoose.Schema({
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
    type: Boolean
  },
  name: {
    type: String
  },
  company: {
    type: String
  },
  blog: {
    type: String
  },
  location: {
    type: String
  },
  email: {
    type: String,
    index: true
  },
  hireable: {
    type: Boolean
  },
  bio: {
    type: String
  },
  twitter_username: {
    type: String
  },
  public_repos: {
    type: Number
  },
  public_gists: {
    type: Number
  },
  followers: {
    type: Number
  },
  following: {
    type: Number
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
  }
})

const User = mongoose.model('user', UserSchema, 'user')

export { User, UserSchema }
