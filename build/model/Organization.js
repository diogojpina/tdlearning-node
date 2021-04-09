"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _mongoose = require('mongoose'); var _mongoose2 = _interopRequireDefault(_mongoose);

const OrganizationSchema = new _mongoose2.default.Schema({
  login: {
    type: String,
    required: true,
    index: true
  },
  id: {
    type: String,
    required: true,
    index: true
  },
  node_id: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
  },
  status: {
    type: Number,
    index: true,
    default: 0
  }
})

const Organization = _mongoose2.default.model('organization', OrganizationSchema, 'organization')

exports.Organization = Organization; exports.OrganizationSchema = OrganizationSchema;
