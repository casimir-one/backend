import fs from 'fs'
import path from 'path'
import parseFormdata from 'parse-formdata'
import readArchive from './readArchive'
import writeArchive from './writeArchive'
import cloneArchive from './cloneArchive'
import listArchives from './listArchives'

const DOT = '.'.charCodeAt(0)

module.exports = function serveReading(router, opts = {}) {
  const apiUrl = opts.apiUrl || ''
  const serverUrl = opts.serverUrl
  const rootDir = opts.rootDir
  // const origin = opts.origin || '*'
  const baseUrl = apiUrl ? serverUrl+apiUrl : serverUrl

  // listing avalable dars
  // router.get('/!list', async (req, res) => {
  //   listArchives(rootDir)
  //   .then((records) => {
  //     res.status(200).json(records)
  //   })
  //   .catch((err) => {
  //     console.error(err)
  //     res.status(500).send()
  //   })
  // })

  /*
    Endpoint for reading a Dar archive
  */
//  router.get('/:dar', async (req, res) => {
//     let id = req.params.dar || 'default'
//     let archiveDir = path.join(rootDir, id)
//     // checking that the archiveDir is really a subfolder of the root dir
//     let relDir = path.relative(rootDir, archiveDir)
//     if (relDir.charCodeAt(0) === DOT) {
//       return res.status(403).send()
//     }
//     try {
//       let rawArchive = await readArchive(archiveDir, {
//         noBinaryContent: true,
//         ignoreDotFiles: true,
//         versioning: opts.versioning
//       })
//       Object.keys(rawArchive.resources).forEach(recordPath => {
//         let record = rawArchive.resources[recordPath]
//         if (record._binary) {
//           delete record._binary
//           record.encoding = 'url'
//           record.data = `${baseUrl}/${id}/assets/${record.path}`
//         }
//       })
//       res.json(rawArchive)
//     } catch(err) { // eslint-disable-line no-catch-shadow
//       console.error(err)
//       res.status(404).send()
//     }
//   })

// this endpoint is used for serving files statically
// app.get(apiUrl+'/:dar/assets/:file', (req, res) => {
//   let filePath = path.join(rootDir, req.params.dar, req.params.file)
//   fs.stat(filePath, (err) => {
//     if (err) return res.status(404).send()
//     res.sendFile(filePath)
//   })
// })

}


module.exports = function serveWriting(router, opts = {}) {
  const apiUrl = opts.apiUrl || ''
  const serverUrl = opts.serverUrl
  const rootDir = opts.rootDir
  // const origin = opts.origin || '*'
  // const baseUrl = apiUrl ? serverUrl+apiUrl : serverUrl

  /*
    Endpoint for uploading files.
  */
//  router.put('/:dar', (req, res) => {
//   let id = req.params.dar || 'default'
//   parseFormdata(req, (err, formData) => {
//     if (err) {
//       console.error(err)
//       return res.status(500).send()
//     }
//     let archiveDir = path.join(rootDir, id)
//     fs.stat(archiveDir, async (err) => {
//       if (err) return res.status(404).send()
//       try {
//         let archive = JSON.parse(formData.fields._archive)
//         formData.parts.forEach((part) => {
//           let filename = part.filename
//           let record = archive.resources[filename]
//           if (!record) {
//             console.error('No document record registered for blob', filename)
//           } else {
//             // TODO: make sure that this works in different browsers
//             record.data = part.stream
//           }
//         })
//         let version = await writeArchive(archiveDir, archive, {
//           versioning: opts.versioning
//         })
//         res.status(200).json({ version })
//       } catch (err) { // eslint-disable-line no-catch-shadow
//         console.error(err)
//         res.status(500).send()
//       }
//     })
//   })
// })

/*
  Used to clone/fork an archive under a new id
*/
// router.put('/:dar/clone/:newdar', async (req, res) => {
//   let originalPath = path.join(rootDir, req.params.dar)
//   let newPath = path.join(rootDir, req.params.newdar)
//   try {
//     await cloneArchive(originalPath, newPath)
//     res.status(200).json({ status: 'ok' })
//   } catch(err) { // eslint-disable-line no-catch-shadow
//     console.error(err)
//     res.status(500).send()
//   }
// })

}
