import { Request, Response } from 'express'

class TrackingEmailController {
  public async eventWebHook (req: Request, res: Response): Promise<Response> {
    console.log(req.body)
    return res.json({})
  }
}

export default new TrackingEmailController()
