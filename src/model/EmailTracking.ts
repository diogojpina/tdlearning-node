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
    type: String
  }
})

const EmailTracking = mongoose.model('EmailTracking', EmailTrackingSchema, 'EmailTracking')

export { EmailTracking, EmailTrackingSchema }
