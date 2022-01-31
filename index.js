const express = require('express');
const cors = require('cors');
var getUnixTime = require('date-fns/getUnixTime')
const { v4: uuidv4 } = require('uuid');
var cron = require('node-cron');
const app = express();
require('dotenv').config()
app.use(cors({ origin: true }));
const multer = require('multer')
const path = require('path')
const bodyParser = require('body-parser');
app.use(express.static("."))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let posts = []

let currentId = ''

cron.schedule('* * * * *', async () => {
  if (posts.length > 0) {
    const date = getUnixTime(new Date());
    for (let i = 0; i < posts.length; i++) {
      console.log("@@@@", posts[i], i, date, posts)
      if (posts[i].date <= date) {
        posts.splice(i, 1)
        console.log("$$$$$", posts[i], i, date, posts)
      }
    }
  }
});

var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, __dirname)     // './public/images/' directory name where save the file
  },
  filename: (req, file, callBack) => {
    currentId = uuidv4()
    console.log("RTYRTYRTYRTY", file, currentId)
    callBack(null, currentId + path.extname(file.originalname))
  }
})

var upload = multer({
  storage: storage
});

app.post('/posts', upload.single('file'), (req, res) => {
  console.log("Received POST request!", req.body);
  try {
    if (!req.file) {
      console.log("No file upload");
    } else {
      console.log(req.file.filename, currentId)
      let imgsrc = 'http://localhost:3001/' + currentId + path.extname(req.file.originalname)
      let text = req.body.text
      const post = {
        id: currentId,
        text: text,
        image: imgsrc,
        date: getUnixTime(new Date()) + 60,
        likes: 0
      }
      posts.push(post)
      res.status(200).send({ message: "Post created", data: posts });
    }
  } catch (e) {
    console.log("ERROR", e)
    res.status(500).send({ message: "Post not created", data: e });
  }

});

app.get('/posts/:postId', async (req, res) => {
  const request = req.params
  console.log("Received GET BY ID request!");
  const post = posts.find(item => item.id === request.postId)
  if (post != null) {
    res.status(200).send({ message: "Post ok", data: post });
  } else {
    res.status(500).send({ message: "Post not ok", data: null });
  }
});

app.get('/posts', async (req, res) => {
  console.log("Received GET request!");
  res.status(200).send({ message: "Posts ok", data: posts });
});

app.patch('/posts/:postId', async (req, res) => {
  console.log("Received PATCH request!");
  const params = req.params;
  const post = posts.find(item => item.id === params.postId);
  let newPost
  if (post != null) {
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].id === params.postId) {
        posts[i] = { ...posts[i], likes: posts[i].likes + 1, date: posts[i].date + 30 }
        newPost = posts[i]
      }
    }
    res.status(200).send({ message: "Post ok", data: newPost });
  } else {
    res.status(500).send({ message: "Post not found", data: null });
  }
});
const port = 3001
app.listen(port, () => {
  console.log(`snapserver corriendo en http://localhost:${port}`)
});