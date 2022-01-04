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

  const domainsAttributeId = "5f62d4fa98f46d2938dde1eb";
  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];
    let chainProject = chainProjects.find(r => r.projectId == project._id.toString());
    let domains = chainProject.disciplines.map(d => d);

    const attribute = project.attributes.find(attr => attr.attributeId.toString() == domainsAttributeId);

    if (attribute) {
      attribute.value = domains;
    } else {
      project.attributes.push({
        value: domains,
        attributeId: mongoose.Types.ObjectId(domainsAttributeId),
      });
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


