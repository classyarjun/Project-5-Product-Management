const jwt = require("jsonwebtoken");
const userModel = require("../Models/usermodel");
const validator = require("../validators/validator");

const authentication = async function (req, res, next) {
  try {
    let token = req.headers["authorization"];

    if (!token)
      return res.status(400).send({ status: false, msg: "token is required" });

    if (token.startsWith("Bearer")) {
      token = token.slice(7, token.length);
    }

    try {
      let decodedtoken = jwt.verify(token, "we-are-from-group11");
      req.userId = decodedtoken.payload.userId;
    } catch (error) {
      return res.status(401).send({ status: false, msg: "token is invalid" });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: error.message });
  }
};
const authorisation = async function (req, res, next) {
  try {
    let token = req.headers["authorization"];

    if (token.startsWith("Bearer")) {
      token = token.slice(7, token.length);
    }

    let decodedtoken = jwt.verify(token, "we-are-from-group11");

    let toBeupdateduserId = req.params.userId;

    if (!validator.isValidObjectId(toBeupdateduserId)) {
      return res.status(400).send({status: false,message: "Enter the UserID & it should be valid",});
    }

    let updatinguserId = await userModel
      .find({ _id: toBeupdateduserId })
      .select({ _id: 1 });

    //let id = decodedtoken.userId
    //if (id != userId) return res.status(403).send({ status: false, msg: "You are not authorised to perform this task" })

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: error.message });
  }
};

module.exports.authentication = authentication;
module.exports.authorisation = authorisation;
