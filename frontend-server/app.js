const express = require('express')
const path = require('path');
const app = express()
const port = 80

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
})

app.listen(port)
