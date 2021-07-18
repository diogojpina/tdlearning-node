import { Request, Response } from 'express'
import { EmailTracking } from '../model/EmailTracking'

class TrackingEmailController {
  public async eventWebHook (req: Request, res: Response): Promise<Response> {
    const trackings = []
    for (const tracking of req.body) {
      trackings.push({
        email: tracking.email,
        event: tracking.event,
        timestamp: tracking.timestamp,
        smtpId: tracking['smtp-id']
      })

      await EmailTracking.create({
        email: tracking.email,
        event: tracking.event,
        timestamp: tracking.timestamp,
        smtpId: tracking['smtp-id']
      })
    }
    // await EmailTracking.insertMany(trackings)

    return res.json({})
  }
}

export default new TrackingEmailController()
