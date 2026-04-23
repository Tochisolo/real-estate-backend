const express = require("express");
const router = express.Router();

const { createUser, loginUser, getUsers, getUser, updateUser, deleteUser, verifyOtp, resendOtp } = require("../controllers/User.js");

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);


module.exports = router;