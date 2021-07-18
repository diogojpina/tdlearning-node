import { Request, Response } from 'express'
import { EmailTracking } from '../model/EmailTracking'

class TrackingEmailController {
  public async eventWebHook (req: Request, res: Response): Promise<Response> {
    console.log('body', req.body)
    await EmailTracking.insertMany(req.body)

    return res.json({})
  }
}

export default new TrackingEmailController()
