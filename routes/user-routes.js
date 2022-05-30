const router = require("express").Router();
const { check } = require("express-validator");

const usersController = require("../controller/user-controller");

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(), //name key from req.body
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.singup
);

router.post("/login", usersController.login);

module.exports = router;
