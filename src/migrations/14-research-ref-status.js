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

const PROJECT_STATUS = require('./../constants/projectStatus').default;


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  
  const projectPromises = [];
  const projectRefs = await Project.find({});

  for (let i = 0; i < projectRefs.length; i++) {
    let projectRef = projectRefs[i];
    projectRef.status = PROJECT_STATUS.APPROVED;
    projectPromises.push(projectRef.save());
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


