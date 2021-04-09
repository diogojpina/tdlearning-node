"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _GithubController = require('../controllers/GithubController'); var _GithubController2 = _interopRequireDefault(_GithubController);
 class DefaultRoutes {
   static map (app) {
    app.get('/', (req, res) => {
      res.json({})
    })
    app.get('/import-repository', _GithubController2.default.importRepository);
    app.get('/import-user', _GithubController2.default.importUser);
    app.get('/import-organization', _GithubController2.default.importOrganization);
  }
} exports.DefaultRoutes = DefaultRoutes;
