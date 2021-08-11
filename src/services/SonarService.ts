import { Pool } from 'pg'
import crypto from 'crypto'

export class SonarService {
  private pool: Pool

  constructor () {
    this.pool = new Pool({
      host: process.env.SONAR_DB_HOST,
      port: parseInt(process.env.SONAR_DB_PORT),
      user: process.env.SONAR_DB_USER,
      password: process.env.SONAR_DB_PASS,
      database: process.env.SONAR_DB_NAME
    })
  }

  public async getProject (kee: string): Promise<any> {
    const query = `SELECT * FROM projects WHERE qualifier = 'TRK' AND kee = '${kee}' limit 1`
    const res = await this.pool.query(query)

    if (res.rowCount === 0) {
      throw new Error('Project not found!')
    }

    return res.rows[0]
  }

  public async getParticipantByProjectEmail (projectId, email) {
    const code = crypto.createHash('sha512').update(email).digest('hex')

    const query = `SELECT * FROM participant WHERE project_id = '${projectId}' AND code = '${code}' limit 1`
    console.log('query', query)
    const res = await this.pool.query(query)

    if (res.rowCount === 0) {
      return null
    }

    return res.rows[0]
  }

  public async addParticipant (projectId, email) {
    const code = crypto.createHash('sha512').update(email).digest('hex')

    const query = `INSERT INTO participant (project_id, code) VALUES('${projectId}', '${code}') RETURNING *`
    const res = await this.pool.query(query)

    console.log('res', res)

    if (res.rowCount === 0) {
      throw new Error('Participant was not created!')
    }

    return res.rows[0]
  }

}
