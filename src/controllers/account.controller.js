const { compareSync, hashSync } = require("bcryptjs");
const AccountModel = require("../models/account.model");
const jwt  = require("jsonwebtoken");
const { config } = require("../config");
const { isEmailValid } = require("../utils/validator");
const {cloudinary} = require("../utils/cloudinary");
const ProfileModel = require("../models/profile.model");
const { APIError } = require("../middlewares/errorApi");

exports.register = async (req, res, next) => {
  try {
    const {password, username,lastName, firstName, email, dob, address} = req.body;
    if(!isEmailValid(email)) return next(APIError.badRequest("Invalid email"))  
    const hashedPassword = hashSync(password, 10)
    const user = {
      password: hashedPassword,
      username,
      lastName,
      firstName,
      email,
      dob,
      address,
      type: "user",
    };
    const newUser = await AccountModel.create({...user});
    if(!newUser)  return res.status(400).json({error: "user failed to create"});
   return res.status(200).json({success: true, msg: "Account created successfully"});

  }catch (error) {
    next(error);
  }
}

exports.login = async (req, res) => {
  try {
    let token = req.headers?.authorization?.split(" ")[1];
    if(!token) token = req.headers?.cookie?.split("=")[1];
    const {username, password} = req.body;
    console.log(req.body)
    if(!username) return res.status(400).json({error: "username is required"})
    if(!password) return res.status(400).json({error: "password is required"});
    const userExist = await AccountModel.findOne({username});
    if(!userExist) return res.status(404).json({error: "user does not exist"});
    const checkUser = compareSync(password, userExist.password);
    if(!checkUser) res.status(400).json({error: "Incorrect password"});
    if(userExist.state === "deactivated") return next(APIError.unauthorized("Account has been deactivated"));
    if(token){ 
      jwt.verify(token, config.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
          return res.status(403).json({error: "token expired"})        } 
      }); 
       return res.status(403).json({error: "You are already logged in"})
      }
    // authentication
    const payload = {
      id: userExist._id,
      email:userExist.email,
      role: userExist.type
    };
    const accessToken = jwt.sign(payload,config.ACCESS_TOKEN_SECRET,{expiresIn:"5m"});
    const refreshToken = jwt.sign(payload,config.REFRESH_TOKEN_SECRET ,{expiresIn:"20m"});
    userExist.refreshToken.push(refreshToken)
    userExist.save();
    res.cookie(
      'bflux', accessToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        // maxAge: 60*60 * 1000
      })
     res.status(200).json({
      msg: "login successful",
      user:{
        username: userExist.username,
        email: userExist.email,
        firstName: userExist.firstName,
      },
      accessToken,
      refreshToken,
     })
  } catch (error) {
    return {error}
  }
}


exports.updateProfile = async (req, res) => {
  try{
    //fileData
    const {fileData} = req.body;
    // first image upload
    console.log(fileData)
    const profile ={};
    if(fileData){
    //   cloudinary.uploader.upload(fileData, (error, result) => {
    //     if(error) return res.status(400).json({error});
    //     profile.imageId = result.public_id;
    //     profile.imageUrl = result.secure_url;
    //   })
    const result = await cloudinary.uploader.upload(fileData, {
      upload_preset: "result_mgt_dev_setup",
      folder: "dev_test",
    })
    } 
    if(result.error) return res.status(400).json({error});
    profile.imageId = result.public_id;
    profile.imageUrl = result.secure_url;
    // save image url to database
    const saveImage = ProfileModel.create({...profile});
    if(saveImage.error) return res.status(400).json({error});
    res.status(200).json({success: true, msg: "profile picture update successfully"});
  }catch(error){
  return {error}
  }
}

exports.updateAccountStatus = async(req, res, next) => {
  try {
    const {id, state} = req.body;
    if(!id) return next(APIError.badRequest("Account id is required"));
    if(!state) return next(APIError.badRequest("Account state is required"));
    const userExist = await AccountModel.findOne({_id:id.toString()});
    if(!userExist) return next(APIError.notFound());
    if(userExist.error) return next(APIError.badRequest(userExist.error));
    // update status
    userExist.state = state;
    userExist.save();
    res.status(200).json({success: true, msg:"Account state updated"})
  } catch (error) {
    next(error)
  }
}

exports.userAccounts = async (req, res, next) =>{
  try {
    const users = await AccountModel.find({}).exec();
    if(users.length === 0) return next(APIError.notFound());
    res.status(200).json({success: true, msg: "Found", users})
  } catch (error) {
    next(error);
  }
}

exports.refreshToken = async (req, res, next) => {
  try {
    let token = req.headers?.authorization?.split(" ")[1];
    if(!token) token = req.headers?.cookie?.split("=")[1]; 
    const refreshToken = req.body; 
    if(!refreshToken) return  next(APIError.badRequest("RefreshToken is required"))//res.status(400).json({error: "RefreshToken is required"})
    if(!token) return res.status(400).json({error: "AccessToken is required"});
    const checkToken = jwt.decode(token, config.ACCESS_TOKEN_SECRET);
    if(!checkToken || checkToken.error) return next(APIError.unauthenticated());

    const foundUser = await AccountModel.findOne({refreshToken}).exec();
  // Detected refresh toke reuse
  if (!foundUser) {
    jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET , async (err, decoded) => {
      if (err) return next(APIError.unauthorized("Invalid Refresh Token"));
      const usedToken = await AccountModel.findOne({_id:decoded.id}).exec();
      usedToken.refreshToken = [];
      usedToken.save();
    }); 
    return next(APIError.unauthorized("Invalid Refresh Token"));
  }

  const newRefreshTokenArr = foundUser.refreshToken.filter(rt => rt !== refreshToken);
  //evaluate jwt
  jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      foundUser.refreshToken = [...newRefreshTokenArr];
      foundUser.save();
    }
    if (err || foundUser._id.toString() !== decoded.id) return next(APIError.unauthenticated("Token expired"));
  });
    //Refresh token still valid  
    const payload = {
      id: userExist._id,
      email:userExist.email,
      role: userExist.type
    };
    const accessToken = jwt.sign(payload, config.TOKEN_SECRETE, {expiresIn:"5m"});
    const newRefreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRET, {expiresIn:"20m"});
    foundUser.refreshToken = [...newRefreshTokenArr, newRefreshToken];
    foundUser.save();   
    res.cookie(
      'bflux', accessToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        // maxAge: 60*60 * 1000
      })
     res.status(200).json({
      success: true,
      msg: "Refresh token renewed", 
      accessToken,
      refreshToken,
     });
  } catch (error) {
    return {error}
  }
  }
  
   exports.logout = async (req, res, next) => {
    try{
      let token = req.headers?.authorization?.split(" ")[1];
      if(!token) token = req.cookie?.bflux;
      if(!token) token = req.headers?.cookie?.split("=")[1]; 
      const {refreshToken} = req.body; 

      if(!refreshToken) return res.status(400).json({error: "RefreshToken is required"})
      if(!token) return res.status(400).json({error: "AccessToken is required"});
      const checkToken = jwt.decode(token)
      if(!checkToken || checkToken.error) return next(APIError.unauthenticated());
  
      const foundUser = await AccountModel.findOne({refreshToken}).exec();
    // Detected refresh toke reuse
    if (!foundUser) {
      jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET , async (err, decoded) => {
        if (err) return next(APIError.unauthorized("Invalid Refresh Token"));
        const usedToken = await AccountModel.findOne({_id:decoded.id}).exec();
        usedToken.refreshToken = [];
        usedToken.save();
      }); 
      return next(APIError.unauthorized("Invalid Refresh Token"));
    }
  
    const newRefreshTokenArr = foundUser.refreshToken.filter(rt => rt !== refreshToken);
    //evaluate jwt
    jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        foundUser.refreshToken = [...newRefreshTokenArr];
        foundUser.save();
      }
      if (err || foundUser._id.toString() !== decoded.id) return next(APIError.unauthenticated("Token expired"));
    });
    res.clearCookie("bflux");
    res
      .status(200)
      .json({ success: true, msg: "You have successfully logged out" });
    }catch(error){
      next(error);
    }
  }