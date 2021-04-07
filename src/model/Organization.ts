import mongoose from 'mongoose'

const OrganizationSchema = new mongoose.Schema({
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
  description: {
    type: String,
  },
  status: {
    type: Number,
    index: true,
    default: 0
  }
})

const Organization = mongoose.model('organization', OrganizationSchema, 'organization')

export { Organization, OrganizationSchema }
