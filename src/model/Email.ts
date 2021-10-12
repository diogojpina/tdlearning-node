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
  subject: {
    type: String
  },
  html: {
    type: String
  },
  text: {
    type: String
  },
  locked: {
    type: Boolean,
    default: true
  },
  smtpId: {
    type: String
  },
  processed: {
    type: Boolean,
    index: true,
    default: false
  },
  processedAt: {
    type: String
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: String
  },
  opened: {
    type: Boolean,
    default: false
  },
  openedAt: {
    type: String
  },
  clicked: {
    type: Boolean,
    default: false
  },
  clickedAt: {
    type: String
  },
  unsubscribed: {
    type: Boolean,
    default: false
  },
  unsubscribedAt: {
    type: String
  }
})

const Email = mongoose.model('email', EmailSchema, 'email')

export { Email, EmailSchema }
