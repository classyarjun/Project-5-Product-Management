const productModel = require("../Models/productsModels");
const validator = require("../validators/validator");
const aws = require("./aws");

//__________________________________________________________________________________________________________________________
//| createProduct |
//__________________________________________________________________________________________________________________________

const createProduct = async (req, res) => {
  try {
    const data = req.body;
    let productImage = req.files;
    const { title, description, price, availableSizes, currencyId } = data;

    /*------------------------- validation ---------------------------------*/

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide body" });
    }
    if (!validator.valid(title)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide title" });
    }
    const checktitle = await productModel.findOne({ title: title });
    if (checktitle) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide unquie title" });
    }
    if (!validator.valid(description)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide description" });
    }

    if (!validator.valid(price)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide price" });
    }
    if (!validator.valid(currencyId)) {
      return res
        .status(400).send({status: false,
          message: "Please provide currency or It should be in valid format",
        });
    }
    if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes)) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please provide availableSizes type bleow",
          likethis: ["S", "XS", "M", "X", "L", "XXL", "XL"],
        });
    }

    if (productImage.length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide productImage" });
    }
    if (productImage && productImage.length > 0) {
      if (!validator.validImageUrl(productImage[0].originalname)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide valid Image file" });
      }
    }
    /*-------------------------create url ---------------------------------*/
    const uploadedFileURL = await aws.uploadFile(productImage[0]);

    data.productImage = uploadedFileURL;

    /*-------------------------create product ---------------------------------*/

    const createProduct = await productModel.create(data);
    return res
      .status(201)
      .send({ status: true, message: "Success", data: createProduct });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
//__________________________________________________________________________________________________________________________
//| getProductByQuery |
//__________________________________________________________________________________________________________________________

const getProductByQuery = async (req, res) => {
  try {
    const data = req.query;

    let { size, name, priceGreaterThan, priceLessThan, priceSort } = data;
    const filterQuery = { isDeleted: false };

    if (size) {
      size = size.toUpperCase();
      size = size.replace(/\s+/g, "").split(",");
      let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
      let present;
      for (let i = 0; i < size.length; i++) {
        present = arr.includes(size[i]);
      }

      if (!present) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Enter a valid size S or XS or M or X or L or XXL or XL",
          });
      }
      filterQuery.availableSizes = { $in: size };
    }

    if (name) {
      data.name = data.name.toLowerCase();

      if (!validValue(name)) {
        return res
          .status(400)
          .send({ status: false, message: "name is only in String Format" });
      }
      filterQuery.title = { $regex: name };
    }

    if (priceGreaterThan) {
      if (!/^[0-9]*$/.test(priceGreaterThan)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "priceGreaterThan should be in Number",
          });
      }
      filterQuery.price = { $gt: priceGreaterThan };
    }

    if (priceLessThan) {
      if (!/^[0-9]*$/.test(priceLessThan)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "priceLessThan should be in Number",
          });
      }
      filterQuery.price = { $lt: priceLessThan };
    }

    if (priceSort) {
      if (priceSort != 1 && priceSort != -1) {
        return res
          .status(400)
          .send({
            status: false,
            message:
              "If you want to use PriceSort use 1 for ascending or  -1 for descending order",
          });
      }
    }

    const productData = await productModel
      .find(filterQuery)
      .sort({ price: priceSort });
    if (productData.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "No product found" });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: productData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
//__________________________________________________________________________________________________________________________
//| getProductbyID |
//__________________________________________________________________________________________________________________________
const getProductById = async function (req, res) {
  try {
    let productId = req.params.productId;
    if (!validator.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter valid productId" });
    }
    let product = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return res
        .status(404)
        .send({ status: false, message: "Product not found" });
    }
    res.status(200).send({ status: true, message: "Success", data: product });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

//__________________________________________________________________________________________________________________________
//| updateProduct |
//__________________________________________________________________________________________________________________________
const updateproduct = async (req, res) => {
  try {
    const productid = req.params.productId;
    const body = req.body;
    let productImage = req.files;
    const { title, description, price, isFreeShipping } = body;
    const data = {};

    /*-------------------------productid validation ---------------------------------*/
    if (!productid) {
      return res
        .status(400)
        .send({ status: false, message: "please provide productid" });
    }
    if (!validator.isValidObjectId(productid)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide correct productid" });
    }
    const checkproductid = await productModel.findById({
      _id: productid,
      isDeleted: false,
    });

    if (!checkproductid) {
      return res
        .status(400)
        .send({ status: false, message: "please provide register productid" });
    }

    /*-------------------------body validation ---------------------------------*/

    if (title) {
      if (!validator.valid(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide title" });
      }
      data.title = title;
    }

    if (description) {
      if (!validator.valid(description)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide description" });
      }
      data.description = description;
    }
    if (price) {
      if (!validator.valid(price)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide description" });
      }
      data.price = price;
    }
    if (body.currencyId) {
      if (!validator.valid(body.currencyId)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please provide Currency Id to update",
          });
      }
      if (body.currencyId.trim() !== "INR") {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please provide Indian Currency Id",
          });
      }
      data.currencyId = body.currencyId;
    }

    if (body.currencyFormat) {
      if (!validator.valid(body.currencyFormat)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please provide Currency Format to update",
          });
      }
      if (body.currencyFormat.trim() !== "₹") {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please provide right format for currency",
          });
      }
      data.currencyFormat = body.currencyFormat;
    }

    if (body.availableSizes) {
      if (!validator.valid(body.availableSizes)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please provide available size to update",
          });
      }

      if (!validator.isValidAvailableSizes(body.availableSizes)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide a valid size" });
      }

      data.availableSizes = body.availableSizes;
    }

    if (body.installments != null) {
      if (!validator.valid(body.installments)) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please provide installment to update",
          });
      }
      data.installments = body.installments;
    }
    if (["true", "false"].includes(isFreeShipping)) {
      data.isFreeShipping = body.isFreeShipping;
    }

    if (productImage.length > 0) {
      const uploadedFileURL = await aws.uploadFile(productImage[0]);
      data.productImage = uploadedFileURL;
    }

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide body" });
    }
    const updateproduct = await productModel.findOneAndUpdate(
      { _id: productid, isDeleted: false },
      data,
      { new: true }
    );
    if (!updateproduct) {
      return res
        .status(404)
        .send({ status: false, message: "product in not exits" });
    }
    return res
      .status(200)
      .send({
        status: true,
        message: "Update product details is successful",
        data: updateproduct,
      });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
//__________________________________________________________________________________________________________________________
//| deleteProduct |
//__________________________________________________________________________________________________________________________

const deleteProduct = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!validator.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter valid productId" });
    }

    let product = await productModel.findById(productId);

    if (!product) {
      return res
        .status(404)
        .send({ status: false, message: "Product not found" });
    } else {
      if (product.isDeleted == true)
        return res
          .status(404)
          .send({ status: false, message: "Product Already deleted" });
    }
    await productModel.findByIdAndUpdate({ _id: productId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    res.status(200).send({ status: true, message: "Product Deleted Successfully" });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = {
  createProduct,
  updateproduct,
  deleteProduct,
  getProductById,
  getProductByQuery,
};
