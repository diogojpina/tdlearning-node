import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

import { DefaultRoutes } from './routes/DefaultRoutes'

import i18n from 'i18n'

import path from 'path'
import { config } from 'dotenv'
import { LocaleService } from './services/LocaleService'

config({ path: path.join(__dirname, '../.env') })
console.log(path.join(__dirname, '../.env'))

i18n.configure({
  locales: ['en'],
  defaultLocale: 'en',
  queryParameter: 'lang',
  directory: path.join(__dirname, 'locales'),
  cookie: 'lang'
})
LocaleService.i18nProvider = i18n

class App {
    public express: express.Application

    public constructor () {
      this.express = express()
      this.database()
      this.middlewares()
      this.routes()
    }

    private database () {
      const host = process.env.MONGO_DB_HOST
      const port = process.env.MONGO_DB_PORT
      const user = process.env.MONGO_DB_USER
      const pass = process.env.MONGO_DB_PASS
      const name = process.env.MONGO_DB_NAME

      console.log(`mongodb://${user}:${pass}@${host}:${port}/${name}?authSource=admin`)

      mongoose.connect(`mongodb://${user}:${pass}@${host}:${port}/${name}?authSource=admin`, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
      })
    }

    private middlewares (): void {
      this.express.use(i18n.init)
      this.express.use(express.json())
      this.express.use(cors())
    }

    private routes (): void {
      DefaultRoutes.map(this.express)
      // GraphQLRoutes.map(this.express)
    }
}

export default new App().express
