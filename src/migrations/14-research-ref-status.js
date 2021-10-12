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
const Research = require('./../schemas/research');

const PROJECT_STATUS = require('./../constants/projectStatus').default;


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  
  const researchPromises = [];
  const researchRefs = await Research.find({});

  for (let i = 0; i < researchRefs.length; i++) {
    let researchRef = researchRefs[i];
    researchRef.status = PROJECT_STATUS.APPROVED;
    researchPromises.push(researchRef.save());
  }

  await Promise.all(researchPromises);

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


