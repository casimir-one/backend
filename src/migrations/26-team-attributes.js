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


const config = require('./../config');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const AttributeValueSchema = new Schema({
  "_id": false,
  "attributeId": { type: Schema.Types.ObjectId, required: false },
  "researchAttributeId": { type: Schema.Types.ObjectId, required: false, default: undefined },
  "value": { type: Schema.Types.Mixed, default: null }
});

const TeamSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "creator": { type: String, required: true },
  "name": { type: String, required: false, default: undefined },
  "description": { type: String, required: false, default: undefined },
  "attributes": [AttributeValueSchema],
  "researchAreas": [Object],

}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const ResearchGroupRef = mongoose.model('research-groups', TeamSchema);

const run = async () => {
  const teamPromises = [];  
  const researchGroupRefs = await ResearchGroupRef.find({});
  for (let i = 0; i < researchGroupRefs.length; i++) {
    const researchGroupRef = researchGroupRefs[i];
    const researchGroupRefObj = researchGroupRef.toObject();
    researchGroupRef.attributes = [
      {
        attributeId: mongoose.Types.ObjectId("6082c4d594bce65929ea2ec2"),
        value: researchGroupRefObj.name
      },
      {
        attributeId: mongoose.Types.ObjectId("6082c4d594bce65929ea2ec3"),
        value: researchGroupRefObj.description
      }
    ];

    researchGroupRef.name = undefined;
    researchGroupRef.description = undefined;

    teamPromises.push(researchGroupRef.save());
  }

  await Promise.all(teamPromises);
    
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