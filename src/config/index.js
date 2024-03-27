require("dotenv").config();

exports.config = {
APPNAME: process.env.APPNAME,
PORT: process.env.PORT,
ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
}