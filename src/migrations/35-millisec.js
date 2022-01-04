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
// const TeamSchema = require('../schemas/TeamSchema');

const Schema = mongoose.Schema;

const SignerSchema = new Schema({
  "_id": false,
  "id": { type: String, required: true },
  "date": { type: Schema.Types.Mixed, required: true }
});

const ContractAgreementSchemaClass = new Schema({
  "_id": { type: String },
  "portalId": { type: String, required: true },
  "status": { type: Number, required: true },
  "creator": { type: String, required: true},
  "parties": { type: Array, required: true},
  "hash": { type: String, required: true},
  "activationTime": { type: Schema.Types.Mixed },
  "expirationTime": { type: Schema.Types.Mixed },
  "acceptedByParties": { type: Array, default: [] },
  "proposalId": { type: String },
  "signers": [SignerSchema],
  "type": {
    type: Number,
    required: true
  },
  "terms": { type: Object, required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


const ContractAgreementSchema = mongoose.model('contract-agreement', ContractAgreementSchemaClass);

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const contractAgreementsPromises = [];

  const contractAgreements = await ContractAgreementSchema.find({});

  for (let i = 0; i < contractAgreements.length; i++) {
    const contractAgreement = contractAgreements[i];
    const contractAgreementObj = contractAgreement.toObject();
    if (contractAgreement.expirationTime) {
      contractAgreement.expirationTime = +contractAgreementObj.expirationTime;
      contractAgreement.signers = contractAgreementObj.signers.map(c => ({
        ...c,
        date: new Date(c.date).getTime()
      }));
      console.log(contractAgreement.expirationTime, 'contractAgreement.expirationTime')
      contractAgreementsPromises.push(contractAgreement.save());
    }
  }

  await Promise.all(contractAgreementsPromises);

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