import mongoose, { Schema } from 'mongoose'

const EmailSchema = new mongoose.Schema({
  email: {
    type: String,
    index: true
  },
  user: { type: Schema.Types.ObjectId, ref: 'user' },
  repoFullName: {
    type: String,
    index: true
  },
  size: {
    type: Number
  },
  forks: {
    type: Number
  },
  repo: { type: Schema.Types.ObjectId, ref: 'repo' },
  vars: {
    participant: {
      name: { type: String }
    },
    project: {
      name: { type: String },
      baseUrl: { type: String },
      url: { type: String },
      cancelUrl: { type: String }
    },
    concentUrl: { type: String }
  },
  subject: {
    type: String
  },
  // html: {
  //   type: String
  // },
  // text: {
  //   type: String
  // },
  locked: {
    type: Boolean,
    default: true
  },
  ttl: {
    type: Number,
    default: 0
  },
  smtpId: {
    type: String,
    index: true
  },
  processed: {
    type: Boolean,
    index: true,
    default: false
  },
  processedAt: {
    type: Date
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  opened: {
    type: Boolean,
    default: false
  },
  openedAt: {
    type: Date
  },
  clicked: {
    type: Boolean,
    default: false
  },
  clickedAt: {
    type: Date
  },
  unsubscribed: {
    type: Boolean,
    default: false
  },
  unsubscribedAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
})

const Email = mongoose.model('email', EmailSchema, 'email')

export { Email, EmailSchema }
