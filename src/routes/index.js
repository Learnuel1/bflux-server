const express = require("express");
const { register, login, updateProfile, userAccounts } = require("../controllers/account.controller");
const { userRequired, adminRequired } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/user/register", register).post("/user/login", login)
router.post("/user/update-profile", userRequired, updateProfile)
router.get("/user/accounts", adminRequired, userAccounts)


module.exports = router;