import mongoose from 'mongoose'

const EmailTrackingSchema = new mongoose.Schema({
  email: {
    type: String,
    index: true
  },
  event: {
    type: String,
    index: true
  },
  timestamp: {
    type: String
  },
  smtpId: {
    type: String,
    index: true
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  }
})

const EmailTracking = mongoose.model('emailTracking', EmailTrackingSchema, 'emailTracking')

export { EmailTracking, EmailTrackingSchema }
