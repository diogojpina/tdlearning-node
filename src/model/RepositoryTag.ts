import mongoose, { Schema } from 'mongoose'

const RepositoryTagSchema = new Schema({
  tag: {
    type: String,
    required: true,
    index: true
  },
  repository: { type: Schema.Types.ObjectId, ref: 'repository' },
  analyzed: {
    type: Number,
    index: true,
    default: 0
  }
})

const RepositoryTag = mongoose.model('repository_tag', RepositoryTagSchema, 'repository_tag')
export { RepositoryTag, RepositoryTagSchema }
