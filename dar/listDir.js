import path from 'path';
import FileStorage from './../storage';

const DOT = '.'.charCodeAt(0)

/*
  Retrieves a list of entries recursively, including file names and stats.
*/
module.exports = async function listDir(dir, opts = {}) {
  return new Promise((resolve, reject) => {
    _list(dir, opts, (err, records) => {
      if (err) reject(err)
      else resolve(records)
    })
  })
}


async function _list(dir, opts, done) {
  let results = []

  try {

    const list = await FileStorage.listDir(dir);
    let pending = list.length
    if (!pending) return done(null, results)

    function _continue() {
      if (!--pending) {
        done(null, results);
      } 
    }
  
    for (const name of list) {
      
      if (opts.ignoreDotFiles && name.charCodeAt(0) === DOT) {
        _continue();
        continue;
      }

      const absPath = `${dir}/${name}`;
      const stat = await FileStorage.stat(absPath);

      if (stat && (typeof stat.isDirectory === 'function' ? stat.isDirectory() : stat.isDirectory)) {
        await _list(name, opts, (err, res) => {
          results = results.concat(res);
          _continue();
        });
      } else {
        results.push(Object.assign({}, stat, {
          name,
          path: absPath
        }))
        _continue();
      }

    }

  } catch(err) {
    console.error(err);
    return done(err);
  }
 
}
