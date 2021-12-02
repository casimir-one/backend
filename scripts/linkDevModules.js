/* eslint-disable */
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');
const symlinkDir = require('symlink-dir');
const rimraf = require('rimraf');
const inquirer = require('inquirer');
/* eslint-enable */

const prompt = inquirer.createPromptModule();

const monorepoPath = path.join(__dirname, '..', '..', 'deip-modules');

// eslint-disable-next-line import/no-dynamic-require
const packages = require(
  path.join(monorepoPath, 'lerna.json')
)
  .packages
  .reduce((acc, pkgDir) => {
    const pkgs = glob
      .sync((path.join(monorepoPath, pkgDir)))
      .map((pkg) => ({
        // eslint-disable-next-line global-require,import/no-dynamic-require
        name: require(path.join(pkg, 'package.json')).name,
        path: pkg
      }));
    return [...acc, ...pkgs];
  }, []);

const modulesToRemove = ['vue', 'vuetify'];
const modulesToRemoveNamesGlob = `+(${modulesToRemove.join('|')})`;

prompt([{
  type: 'list',
  name: 'select',
  message: 'Link modules',
  default: ['all'],
  choices: [
    {
      value: 'all',
      name: 'All'
    },
    {
      value: 'select',
      name: 'Select'
    }
  ]
}])
  .then((answer) => {
    if (answer.select === 'all') {
      return { packages };
    }

    return inquirer.prompt([{
      type: 'checkbox',
      name: 'packages',
      message: 'Select modules for linking',
      default: ['all'],
      pageSize: 10,
      choices: packages.map((pkg) => ({ name: pkg.name, value: pkg }))
    }]);
  })
  .then((answer) => {
    const linkModulesPromises = answer.packages.map((pkg) => {
      const dest = path.join(__dirname, '..', 'node_modules', pkg.name);

      return symlinkDir(pkg.path, dest)
        .then(() => {
          console.info(`${pkg.name} linked`);

          const modulesToRemoveGlob = path.join(
            dest,
            'node_modules',
            modulesToRemoveNamesGlob
          );

          if (glob.sync(modulesToRemoveGlob).length) {
            rimraf(modulesToRemoveGlob, {}, () => {
              console.info(`${modulesToRemove} removed from ${pkg.name}`);
            });
          }
        });
    });

    return Promise.all(linkModulesPromises);
  })
  .then(() => {
    const globalPath = path.join(__dirname, '..', '..', 'deip-modules', 'node_modules', modulesToRemoveNamesGlob);
    rimraf(globalPath, {}, () => {
      console.info(`${modulesToRemove} removed from @deip`);
    });
  })
  .catch((err) => console.error(err));
