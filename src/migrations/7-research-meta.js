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
const Project = require('./../schemas/ProjectSchema');

const ChainService = require('@deip/chain-service').ChainService;


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc()

  const projectPromises = [];
  const projects = await Project.find({});
  const chainProjects = await Promise.all(projects.map(r => chainRpc.getProjectAsync(r._id)));

  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];
    let chainProject = chainProjects.find(r => r.projectId == project._id);

    if (chainProject) {
      project.title = chainProject.title;
      project.abstract = chainProject.abstract;
    }

    projectPromises.push(project.save());
  }

  await Promise.all(projectPromises);

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


