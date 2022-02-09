import { Pool } from 'pg'
import crypto from 'crypto'
import { stat } from 'fs'

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

  public async getAllProjectsUUID (): Promise<string[]> {
    const query = 'select uuid from projects'
    const res = await this.pool.query(query)

    const uuids: string[] = []
    for (const row of res.rows) {
      uuids.push(row.uuid)
    }

    return uuids
  }

  public async getAllProjectsKee (): Promise<any> {
    const query = 'select kee from projects'
    const res = await this.pool.query(query)

    return res.rows
  }

  public async getProjectsByKeeLike (kee: string): Promise<any> {
    const query = `select * from projects where kee like '%${kee}%' order by kee`
    const res = await this.pool.query(query)

    return res.rows
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

  public async getProjectTDsStats (projectKee: string) {
    const tds = await this.getProjectTDs(projectKee)

    const stats = {
      count: tds.rowCount,
      blocker: 0,
      critcal: 0,
      major: 0,
      minor: 0,
      info: 0,
      contributors_count: 0,
      files_count: 0,
      rules_count: 0
    }

    const contributors: string[] = []
    const files: string[] = []
    const rulesId: number[] = []

    for (const td of tds.rows) {
      if (td.severity === 'BLOCKER') {
        stats.blocker++
      } else if (td.severity === 'CRITICAL') {
        stats.critcal++
      } else if (td.severity === 'MAJOR') {
        stats.major++
      } else if (td.severity === 'MINOR') {
        stats.minor++
      } else if (td.severity === 'INFO') {
        stats.info++
      }

      if (contributors.includes(td.author_login) === false) {
        contributors.push(td.author_login)
      }

      if (files.includes(td.component_uuid) === false) {
        files.push(td.component_uuid)
      }

      if (rulesId.includes(td.rule_id) === false) {
        rulesId.push(td.rule_id)
      }

      // console.log('td', td)
    }

    stats.contributors_count = contributors.length
    stats.files_count = files.length
    stats.rules_count = rulesId.length

    // console.log('td-stats', stats)
    return stats
  }

  public async getTDByProjectUUID (uuid: string): Promise<any> {
    const query = `select i.id as issue_id, i.severity, i.line, i.author_login, i.effort, i.tags, 
      i.rule_id, r."name" as rule_name, r.plugin_name, r."scope", r.priority, 
      i.component_uuid, c.kee as component_kee, c.long_name as component_long_name, c."scope" as component_scope, c.qualifier as component_qualifier,
      i.project_uuid, p.kee as project_kee, p."name" as project_name
      from issues i
      inner join rules r on r.id = i.rule_id 
      inner join components c on c.uuid = i.component_uuid 
      inner join projects p on p.uuid = i.project_uuid 
      where p.uuid = '${uuid}'`
    const res = await this.pool.query(query)

    return res
  }

  public async getFilesOverallMeasures (): Promise<any> {
    const query = `select c.uuid, c.long_name, lm.metric_id, m.name, m.domain, m.val_type, lm.value from live_measures lm 
    inner join metrics m on m.id = lm.metric_id 
    inner join components c on c.uuid = lm.component_uuid 
    where c."language" = 'java' and c."scope" = 'FIL' and c.qualifier  = 'FIL' and 
    (m.val_type = 'FLOAT' or m.val_type = 'INT' or m.val_type = 'PERCENT' or m.val_type = 'RATING')    
    order by c.uuid`
    const res = await this.pool.query(query)

    return res
  }

  public async getProjectsOverallMeasuresByProjectUUID (uuid: string): Promise<any> {
    const query = `select c.uuid, c.long_name, lm.metric_id, m.name, m.domain, m.val_type, lm.value from live_measures lm 
    inner join metrics m on m.id = lm.metric_id 
    inner join components c on c.uuid = lm.component_uuid 
    where c."language" = 'java' and c."scope" = 'FIL' and c.qualifier  = 'FIL' and 
    (m.val_type = 'FLOAT' or m.val_type = 'INT' or m.val_type = 'PERCENT' or m.val_type = 'RATING')
    and c.project_uuid = '${uuid}'    
    order by c.uuid`
    const res = await this.pool.query(query)

    return res
  }

  public async getFilesMeasuresByComponentUUID (uuid: string): Promise<any> {
    const query = `select lm.metric_id, m.name, m.short_name, m.description, m.domain, m.val_type, 
      lm.component_uuid, lm.value, lm.text_value from live_measures lm 
      inner join metrics m on m.id = lm.metric_id 
      where lm.component_uuid  = '${uuid}'`
    const res = await this.pool.query(query)

    const keys = ['lines', 'keys', 'new_lines', 'ncloc_language_distribution', 'classes', 'files',
      'functions', 'statements', 'comment_lines', 'comment_lines_density', 'complexity', 'file_complexity',
      'cognitive_complexity', 'coverage', 'lines_to_cover', 'new_lines_to_cover', 'uncovered_lines',
      'new_uncovered_lines', 'line_coverage', 'new_conditions_to_cover', 'new_uncovered_conditions',
      'duplicated_lines', 'new_duplicated_lines', 'duplicated_blocks', 'new_duplicated_blocks',
      'duplicated_lines_density', 'violations', 'major_violations', 'open_issues', 'code_smells',
      'sqale_index', 'sqale_rating', 'development_cost', 'sqale_debt_ratio', 'reliability_rating',
      'security_rating', 'security_review_rating', 'last_commit_date']

    const measures = { }
    for (const key of keys) {
      measures[`measure_${key}`] = null
    }

    for (const measure of res.rows) {
      if (measure.value) {
        // measures[`measure_${measure.name}`] = measure.value
        measures[`measure_${measure.name}`] = parseInt(measure.value)
      }
    }

    return measures
  }

  public async getProjectOverallMeasures (projectKee: string): Promise<any> {
    const query = `select pm.metric_id, m.name, m.short_name, m.description, m.domain, m.val_type, pm.value, pm.text_value
    from project_measures pm 
    inner join projects p on p.uuid = pm.component_uuid
    inner join metrics m on m.id = pm.metric_id 
    where p.kee = '${projectKee}' and 
    (m.val_type = 'FLOAT' or m.val_type = 'INT' or m.val_type = 'PERCENT' or m.val_type = 'RATING')
    order by m.val_type`
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

  public async getAnswers (): Promise<any> {
    const query = `select a.id, a.answer1, i.severity , r.name as rule_name, i.component_uuid, c.long_name from answer a 
      inner join issues i on i.id  = a.issue_id 
      inner join rules as r on r.id = i.rule_id
      inner join components c on c.uuid = i.component_uuid 
      where a.id > 300`
    const res = await this.pool.query(query)

    return res.rows
  }
}
