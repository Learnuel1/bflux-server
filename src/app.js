const express = require("express");
const { config } = require("./config");
const app  = express();
const cors = require("cors");
const { errorHandler } = require("./middlewares/error.middleware");
require("dotenv").config();
app.use(cors())

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use("/api/v1/status", (req, res) =>{
  res.send(`Yes!... Welcome ${config.APPNAME} API`);
});
app.use(errorHandler)
module.exports = app;
