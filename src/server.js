import express from "express"
import path from "path"
import fs from "fs-extra"
import https from 'https'
import multer from 'multer'
import {fileURLToPath} from 'url';

const app = express()

const externalUrl = process.env.RENDER_EXTERNAL_URL
const PORT = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
})

const UPLOAD_PATH = path.join(__dirname, "public", "upload");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})
const uploadPictures = multer({ storage: storage }).single("image");

app.get("/pictures", function(req, res) {
    res.sendFile(path.join(__dirname, "public", "pictures.html"));
})

app.get("/uploads", function (req, res) {
    let files = fs.readdirSync(UPLOAD_PATH);
    res.json({files});
});

app.get("/nativeAPI", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "nativeAPI.html"));
});

app.post('/saveUpload', function (req, res) {
    uploadPictures(req, res, async function (err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                error: {
                    message: 'Upload failed: ' + JSON.stringify(err)
                }
            });
        } else {
            res.json({ success: true, id: req.body.id});
        }
    })
})

const httpPort = 80
if (externalUrl) {
    const hostname = '0.0.0.0'
    app.listen(PORT, hostname, () => {
      console.log(`Server locally running at https://${hostname}:${PORT}/ and from outside on ${externalUrl}`)
    })
  } else {
    app.listen(httpPort, function () {
        console.log(`HTTP listening on port: http://localhost:${httpPort}`);
    });
  }