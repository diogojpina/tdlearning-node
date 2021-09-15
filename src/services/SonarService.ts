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

  public async getProjectTDs (projectKee: string) {
    const query = `select  i.component_uuid, c.long_name, i.severity, i.message, i.line, i.status, i.author_login, 
      i.rule_id, r.name, r.priority , r.language, r.system_tags
      from issues i 
      inner join components c on c.uuid = i.component_uuid
      inner join projects p on p.uuid = c.project_uuid 
      inner join rules r on r.id  = i.rule_id
      where p.kee = '${projectKee}'`
    const res = await this.pool.query(query)

    return res
  }

  public async getProjectMeasures (projectKee: string): Promise<Map<string, Map<string, any[]>>> {
    const query = `select lm.metric_id, m.name, m.short_name, m.description, m.domain, m.val_type, 
      lm.component_uuid, c.long_name, lm.value, lm.text_value from live_measures lm
      inner join metrics m on m.id = lm.metric_id 
      inner join components c on c.uuid = lm.component_uuid
      inner join projects p on p.uuid = c.project_uuid 
      where p.kee = '${projectKee}'
      order by c.uuid`
    const res = await this.pool.query(query)

    const measures = new Map<string, Map<string, any[]>>()
    for (const row of res.rows) {
      const fileId = row.long_name
      const metricName = row.name

      if (measures.has(fileId) === false) {
        measures.set(fileId, new Map<string, any[]>())
      }

      const file = measures.get(fileId)
      if (file.has(metricName) === false) {
        file.set(metricName, row)
      }
    }

    return measures
  }

  public formatMeasures (measures: any) {
    const formatedMeasures = []
    for (const [key, measure] of measures) {
      let value = measure.value
      if (measure.val_type === 'INT' || measure.val_type === 'RATING' || measure.val_type === 'MILLISEC' || measure.val_type === 'WORK_DUR') {
        value = parseInt(measure.value)
      } else if (measure.val_type === 'FLOAT' || measure.val_type === 'PERCENT') {
        value = parseFloat(measure.value)
      } else if (measure.val_type === 'STRING') {
        value = measure.text_value
      } else if (measure.val_type === 'DATA') {
        continue
      }

      // console.log('measure', measure)
      formatedMeasures.push({
        key,
        value: value
        // valueText: measure.text_value
      })
    }
    return formatedMeasures
  }
}
