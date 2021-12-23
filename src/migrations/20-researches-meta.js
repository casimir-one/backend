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
const ChainService = require('@deip/chain-service').ChainService;
const crypto = require('crypto');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc()

  const projectsPromises = [];
  const chainProjects = await chainRpc.getProjectsListAsync();
  
  for (let i = 0; i < chainProjects.length; i++) {
    const chainProject = chainProjects[i];

    // const project = await Project.findOne({ _id: chainProject._id });

    // const titleAttr = project.attributes.find(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.TITLE.toString());
    // const title = titleAttr ? titleAttr.value : "";
    const title = chainProject.title;

    // const descriptionAttr = project.attributes.find(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.DESCRIPTION.toString());
    // const description = descriptionAttr ? descriptionAttr.value : "";
    const description = chainProject.abstract;

    const meta = { title: title, description: description };
    const hash = crypto.createHash('sha256').update(JSON.stringify(meta)).digest("hex");

    console.log({ id: chainProject.projectId, hash });

    // projectsPromises.push(project.save());
  }

  await Promise.all(projectsPromises);

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


