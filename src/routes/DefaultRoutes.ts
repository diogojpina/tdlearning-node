import express from 'express'
import GithubController from '../controllers/GithubController'
import TrackingEmailController  from '../controllers/TrackingEmailController'
export class DefaultRoutes {
  public static map (app: express.Application): void {
    app.get('/', (req: express.Request, res: express.Response) => {
      res.json({})
    })
    app.get('/import-repository', GithubController.importRepository)
    app.get('/import-user', GithubController.importUser)
    app.get('/import-organization', GithubController.importOrganization)

    app.post('/tracking-email', TrackingEmailController.eventWebHook)
  }
}
