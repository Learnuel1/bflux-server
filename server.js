const { default: mongoose, connect } = require("mongoose");
const app  = require("./src/app");
const { config } = require("./src/config");
const router = require("./src/routes");
const { notFound, errorHandler } = require("./src/middlewares/error.middleware");
require("dotenv").config();
app.use("/api/v1", router)
app.all("*", notFound);
app.use(errorHandler);
app.listen(config.PORT, async()=>{
  try{
// connect to database
console.log("connecting to database...");
// mongoose.set("StrictQuery", true);
connect(config.DB_URL);
console.log("database connected successfully...")

console.log(`server is running on localhost:${config.PORT}`)
}catch(error){
  console.error(error);
  process.exit(-1);
}
})