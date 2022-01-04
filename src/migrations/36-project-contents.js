require("@babel/register")({
  "presets": [
    [
      "@babel/env",
      {
        "targets": {
          "node": "current"
        }
      }
    ]
  ]
});

require("@babel/register")({
  "only": [
    function (filepath) {
      return filepath.includes("node_modules/@deip") || filepath.includes("node_modules/crc");
    },
  ]
});

const config = require('../config');

const mongoose = require('mongoose');
const { PROJECT_CONTENT_FORMAT, PROJECT_CONTENT_TYPES } = require('@deip/constants');
const { ChainService } = require('@deip/chain-service');

const Schema = mongoose.Schema;

const ProjectContentSchemaClass = new Schema({
  "_id": { type: String },
  "portalId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "folder": { type: String, required: true },
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "contentType": {
    type: Number,
    enum: [...Object.values(PROJECT_CONTENT_TYPES)],
    default: PROJECT_CONTENT_TYPES.ANNOUNCEMENT
  },
  "formatType": {
    type: Number,
    enum: [...Object.values(PROJECT_CONTENT_FORMAT)],
    default: PROJECT_CONTENT_FORMAT.PACKAGE
  },
  "type": {
    type: Number,
    enum: [...Object.values(PROJECT_CONTENT_FORMAT)]
  },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
  "authors": [{ type: String }],
  "references": [{ type: String }],
  "foreignReferences": [{ type: String }],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const ProjectContentSchema = mongoose.model('project-content', ProjectContentSchemaClass);

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const projectContentsPromises = [];

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();

  
  const projectContents = await ProjectContentSchema.find({});
  const chainProjectContents = await chainRpc.getProjectContentsAsync(projectContents.map(c => c._id));

  for (let i = 0; i < projectContents.length; i++) {
    const projectContent = projectContents[i];
    const projectContentObj = projectContent.toObject();
    if (!projectContent.formatType) {
      projectContent.formatType = projectContent.type;
    }
    if (!projectContent.contentType) {
      const chainProjectContent = chainProjectContents.find((chainProjectContent) => !!chainProjectContent && chainProjectContent.external_id == projectContent._id);
      if (chainProjectContent) {
        projectContent.contentType = PROJECT_CONTENT_TYPES[chainProjectContent.content_type.toUpperCase()]
      }
    }
    projectContentsPromises.push(projectContent.save());
  }

  await Promise.all(projectContentsPromises);

};

run()
  .then(() => {
    console.log('Successfully finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });