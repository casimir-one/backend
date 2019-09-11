require("babel-core/register")({
  "presets": [
      ["env", {
          "targets": {
              "node": true
          }
      }]
  ]
});

const mongoose = require('mongoose');
const bluebird = require('bluebird');
const config = require('./../config');
const filesUtil = require('./../utils/files').default;

mongoose.connect(config.mongo['deip-server'].connection);

const fileRef = require('./../schemas/fileRef');

const run = async () => {
  const refsToMigrate = await fileRef.find({
    filepath: { $exists: true, $ne: null },
    $or: [{
      encryptedFileHash: { $exists: false }
    }, {
      encryptedFileHash: null
    }]
  }, { _id: 1, filepath: 1 }, { lean: true });

  await bluebird.map(refsToMigrate, async ({ _id, filepath }) => {
    const encryptedFileHash = await filesUtil.sha256(filepath);
    await fileRef.updateOne({ _id }, { $set: { encryptedFileHash } });
  }, { concurrency: 50 })
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