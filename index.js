const fs = require('fs');
const express = require('express');
const multer = require('multer');
const path = require('path');
const rimraf = require('rimraf');
const unzip = require('unzip');

const PORT = 9012;

const app = express();

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./coverage')) fs.mkdirSync('./coverage');

const zip = multer({dest:'./uploads/'});

app.get('/', (req, res) => {
  const folders = fs.readdirSync('./coverage');
  const links = folders.map((folderName) => {
    return `<a href="/${folderName}">${folderName}</a><br />`;
  });
  res.send(
    `<html>
    <head>
    <title>GPMDP Coverage Reports</title>
    </head>
    <body>
    ${links}
    </body>
    </html>`
  );
});

app.post('/submit', zip.single('zip'), (req, res) => {
  if (req.body.key !== (process.env.COVERAGE_ARTIFACT_KEY || '')) {
    res.status(403);
    res.json({error: 'Not authorized to upload coverage file'});
    return;
  }
  const file = req.file;
  const branch = req.body.branch || 'Unknown Branch';
  // fs.rename(path.resolve(file.path), path.resolve(`${__dirname}/coverage/${branch}.zip`));
  const branchDir = path.resolve(__dirname, 'coverage', branch);
  rimraf(branchDir, (err) => {
    if (err) return res.status(500).send();
    const readStream = fs.createReadStream(file.path);
      readStream.pipe(unzip.Extract({ path: branchDir }))
        .on('close', () => res.status(200).send());
  });
});

app.use('/', express.static('./coverage'))


app.listen(PORT, () => {
  console.log('Listening on:', PORT)
})
