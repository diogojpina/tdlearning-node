"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express'); var _express2 = _interopRequireDefault(_express);
var _cors = require('cors'); var _cors2 = _interopRequireDefault(_cors);
var _mongoose = require('mongoose'); var _mongoose2 = _interopRequireDefault(_mongoose);

var _DefaultRoutes = require('./routes/DefaultRoutes');

var _i18n = require('i18n'); var _i18n2 = _interopRequireDefault(_i18n);

var _path = require('path'); var _path2 = _interopRequireDefault(_path);
var _dotenv = require('dotenv');
var _LocaleService = require('./services/LocaleService');

_dotenv.config.call(void 0, { path: _path2.default.join(__dirname, '../.env') })
console.log(_path2.default.join(__dirname, '../.env'))

_i18n2.default.configure({
  locales: ['en'],
  defaultLocale: 'en',
  queryParameter: 'lang',
  directory: _path2.default.join(__dirname, 'locales'),
  cookie: 'lang'
})
_LocaleService.LocaleService.i18nProvider = _i18n2.default

class App {
    

     constructor () {
      this.express = _express2.default.call(void 0, )
      this.database()
      this.middlewares()
      this.routes()
    }

     database () {
      const host = process.env.MONGO_DB_HOST
      const port = process.env.MONGO_DB_PORT
      const user = process.env.MONGO_DB_USER
      const pass = process.env.MONGO_DB_PASS
      const name = process.env.MONGO_DB_NAME

      console.log(`mongodb://${user}:${pass}@${host}:${port}/${name}?authSource=admin`)

      _mongoose2.default.connect(`mongodb://${user}:${pass}@${host}:${port}/${name}?authSource=admin`, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
      })
    }

     middlewares () {
      this.express.use(_i18n2.default.init)
      this.express.use(_express2.default.json())
      this.express.use(_cors2.default.call(void 0, ))
    }

     routes () {
      _DefaultRoutes.DefaultRoutes.map(this.express)
      // GraphQLRoutes.map(this.express)
    }
}

exports. default = new App().express
