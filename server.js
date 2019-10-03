const express = require('express');
const db = require('./db');
const {Page} = db.models;

const app = express();

const port = process.env.PORT || 3000;

app.get('/api/pages', async (req, res, next) => {
  try {
    res.send( await Page.findAll());
  }
  catch(ex){
    next(ex);
  }
});




db.syncAndSeed()
  .then(() => app.listen(port, () => console.log(`listening on port ${port}`)));
