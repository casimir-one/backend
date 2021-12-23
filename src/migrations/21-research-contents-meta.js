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

const config = require('./../config');

const mongoose = require('mongoose');
const ProjectContent = require('./../schemas/ProjectContentSchema');
const ChainService = require('@deip/chain-service').ChainService;
const crypto = require('crypto');


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc()

  const projectContentsPromises = [];
  const chainProjectContents = await chainRpc.getProjectContentsListAsync();
  
  for (let i = 0; i < chainProjectContents.length; i++) {
    const chainProjectContent = chainProjectContents[i];

    const projectContentRef = await ProjectContent.findOne({ _id: chainProjectContent.external_id });

    const title = projectContentRef.title;

    const meta = { title: title };
    const hash = crypto.createHash('sha256').update(JSON.stringify(meta)).digest("hex");

    console.log({ id: chainProjectContent.external_id, hash, title });

    // projectContentsPromises.push(projectContentRef.save());
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


