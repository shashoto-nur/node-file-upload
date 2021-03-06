const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// Mongo URI
const mongoURI = '';

// Create mongo connection
const connection = mongoose.createConnection(mongoURI);

conn.once('open', () =>
{
  // Init stream
  let gridfs = Grid(connection.db, mongoose.mongo);
  gridfs.collection('uploads');
});

// Initialize storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (_req, file) =>
  {
    return new Promise((resolve, reject) =>
    {
      crypto.randomBytes(16, (err, buf) =>
      {
        if (err)
          return reject(err);

        const filename = buf.toString('hex') + path.extname(file.originalname);
        
        const fileInfo =
        {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

//Access the storage engine using multer to upload files
const upload = multer({ storage });

//Initial page (loads form and uploaded files)
app.get('/', (req, res) =>
{
  gridfs.files.find().toArray((err, files) =>
  {
    if (!files || files.length === 0)
      res.render('index', { files: false });
    else
    {
      files.map(file =>
        {
          if (file.contentType === 'image/jpeg' || file.contentType === 'image/png')
            file.isImage = true;
          else
            file.isImage = false;
        });
      res.render('index', { files: files });
    }
  });
});

//Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) =>
{
  res.redirect('/');
});

//Display all files in JSON
app.get('/files', (_req, res) =>
{
  gridfs.files.find().toArray((_err, files) =>
  {
    if (!files || files.length === 0)
      return res.status(404).json({err: 'No files exist'});
    return res.json(files);
  });
});


//Display single file object from DB
app.get('/files/:filename', (req, res) =>
{
  gridfs.files.findOne({ filename: req.params.filename }, (err, file) =>
  {
    if (!file || file.length === 0)
      return res.status(404).json({err: 'No file exists'});
    return res.json(file);
  });
});

  //Display Image from DB
app.get('/image/:filename', (req, res) =>
{
  gridfs.files.findOne({ filename: req.params.filename }, (err, file) =>
  {
    if (!file || file.length === 0)
      return res.status(404).json({err: 'No file exists'});

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png')
    {
      // Read output to browser
      const readstream = gridfs.createReadStream(file.filename);
      readstream.pipe(res);
    }
    else
      res.status(404).json({err: 'Not an image'});
  });
});

//Delete file from DB
app.delete('/files/:id', (req, res) =>
{
  gridfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err)
      return res.status(404).json({ err: err });
    res.redirect('/');
  });
});

const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));