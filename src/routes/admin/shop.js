const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;


const Shop = mongoose.model('shop');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');
const { registerUser } = require('../../helper/signups/signupValidation');


/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/ShopList', async (req, res) => {
    try {
        console.log('requet => ', req.query);
        //agentId
        let shopList = []
        if(req.query.agentId == "Admin"){
             shopList = await Shop.find({}, { email: 1, name: 1, mobileno: 1, location: 1, area: 1, createdAt: 1, lastLoginDate: 1, status: 1 ,password:1})

        }else{
             shopList = await Shop.find({agentId: MongoID(req.query.agentId)}, { email: 1, name: 1, mobileno: 1, location: 1, area: 1, createdAt: 1, lastLoginDate: 1, status: 1 ,password:1})
        }
        logger.info('ShopList admin/dahboard.js post dahboard  error => ', shopList);

        res.json({ shopList });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/AgentData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/ShopData', async (req, res) => {
    try {
        console.info('requet => ', req.query.agentId);
        //
        const userInfo = await Shop.findOne({ _id: new mongoose.Types.ObjectId(req.query.agentId) }, { email: 1, name: 1, mobileno: 1,password:1, location: 1, area: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/dahboard.js post dahboard  error => ', userInfo);

        res.json({ userInfo });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {post} /admin/AddUser
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/ShopUpdate', async (req, res) => {
    try {

        console.log("req ", req.body)
        //currently send rendom number and generate 
        let response = {
            $set: {
                email: req.body.email,
                password:req.body.password,
                name: req.body.name,
                mobileno: req.body.mobileno,
                status:req.body.status,
                location:req.body.location,
                area:req.body.area
            }
        }

        console.log("response ", response)

        console.log("response ", req.body)


        const userInfo = await Shop.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(req.body.userId) }, response, { new: true });

        logger.info('admin/dahboard.js post dahboard  error => ', userInfo);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {post} /admin/AddUser
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/AddShop', async (req, res) => {
    try {
        //currently send rendom number and generate 
        console.log("req ", req.body)
        //currently send rendom number and generate 
        if(req.body.email != undefined && req.body.email != null && req.body.email != "" && 
            req.body.password != undefined && req.body.password != null && req.body.password != "" && 
            req.body.name != undefined && req.body.name != null && req.body.name != "" && 
            req.body.mobileno != undefined && req.body.mobileno != null && req.body.mobileno != "" && 
            req.body.status != undefined && req.body.status != null && req.body.status != "" && 
            req.body.location != undefined && req.body.location != null && req.body.location != "" && 
            req.body.area != undefined && req.body.area != null && req.body.area != "" 
         ){
            let response = {
                email: req.body.email,
                password:req.body.password,
                name: req.body.name,
                mobileno: req.body.mobileno,
                createdAt: new Date(),
                lastLoginDate: new Date(),
                status:req.body.status,
                location:req.body.location,
                area:req.body.area,
                agentId:req.body.agentId
            }

            console.log("response ", response)
            let insertRes = await Shop.create(response);

            if (Object.keys(insertRes).length > 0) {
                res.json({ status: "ok" });
            } else {
                logger.info('\nsaveGameUser Error :: ', insertRes);
                res.json({ status: false });
            }
            logger.info('admin/dahboard.js post dahboard  error => ', insertRes);
        }else{
            res.json({ status: false });
        }
        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.delete('/Deleteshop/:id', async (req, res) => {
    try {
        console.log("req ", req.params.id)

        const RecentUser = await Shop.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })

        logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/addMoney', async (req, res) => {
    try {
        console.log("Add Money ", req.body)
        //const RecentUser = //await Agent.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

        logger.info('admin/dahboard.js post dahboard  error => ');

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {post} /admin/deductMoney
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/deductMoney', async (req, res) => {
    try {
        console.log("deductMoney ", req.body)
        //const RecentUser = //await Agent.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

        logger.info('admin/dahboard.js post dahboard  error => ');

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});






async function createPhoneNumber() {
    const countryCode = "91";

    // Generate a random 9-digit mobile number
    const randomMobileNumber = Math.floor(Math.random() * 9000000000) + 1000000000;

    // Concatenate the country code and the random mobile number
    const indianMobileNumber = countryCode + randomMobileNumber;

    return indianMobileNumber;
}

module.exports = router;