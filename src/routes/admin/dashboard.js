const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;


const Users = mongoose.model('users');
const Shop = mongoose.model('shop');
const Agent = mongoose.model('agent');

const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');


/**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', async (req, res) => {
    try {
      console.log('requet => ', req.query);
      let totalUser = 0;
      let totalShop = 0;

      if(req.query.Id == undefined || req.query.Id == "undefined" || req.query.Id == "Admin"){
        totalUser = await Users.find().count()
      }else{
        totalUser = await Users.find({shopId:MongoID(req.query.Id)}).count()

      }

      if(req.query.Id == undefined || req.query.Id == "undefined" || req.query.Id == "Admin"){
        totalShop = await Shop.find().count()
      }else{
        totalShop = await Shop.find({agentId:MongoID(req.query.Id)}).count()
      }

      totalAgent = await Agent.find().count()
      
      const totalDeposit = 100;
      const todayDeposit = 151;
      const totalGamePay = 41654;

      console.log("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
      logger.info('admin/dahboard.js post dahboard  error => ', totalUser);

      res.json({totalUser,totalShop,totalAgent,totalDeposit,todayDeposit,totalGamePay});
    } catch (error) {
      logger.error('admin/dahboard.js post bet-list error => ', error);
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
router.get('/latatestUser', async (req, res) => {
    try {
      console.log('requet => latatestUser ', req.query);
      let t = new Date().setSeconds(new Date().getSeconds() - 604800);
        
        logger.info('admin/dahboard.js post dahboard  error => ', t);
      let RecentUser = []


      if(req.query.Id == undefined || req.query.Id == "Admin"){

        RecentUser = await Users.find({ createdAt :{$gte: new Date(t) } },{username:1,id:1,createdAt:1})

      }else{
        RecentUser = await Users.find({ shopId:MongoID(req.query.Id),createdAt :{$gte: new Date(t) } },{username:1,id:1,createdAt:1})
      }

      logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

      res.json({RecentUser});
    } catch (error) {
      logger.error('admin/dahboard.js post bet-list error => ', error);
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
router.get('/latatestShop', async (req, res) => {
  try {
    console.log('requet => latatestShop ', req.query);
    let t = new Date().setSeconds(new Date().getSeconds() - 604800);
      
      logger.info('admin/dahboard.js post dahboard  error => ', t);
    let RecentUser = []


    if(req.query.Id == undefined || req.query.Id == "Admin"){

      RecentUser = await Shop.find({ createdAt :{$gte: new Date(t) } },{name:1,id:1,createdAt:1})

    }else{
      RecentUser = await Shop.find({ agentId:MongoID(req.query.Id),createdAt :{$gte: new Date(t) } },{name:1,id:1,createdAt:1})
    }

    logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

    res.json({RecentUser});
  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
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
    router.get('/latatestAgent', async (req, res) => {
      try {
        console.log('requet => latatestShop ', req.query);
        let t = new Date().setSeconds(new Date().getSeconds() - 604800);
          
        logger.info('admin/dahboard.js post dahboard  error => ', t);
        let RecentUser = []

        RecentUser = await Agent.find({ createdAt :{$gte: new Date(t) } },{name:1,id:1,createdAt:1})
    
        logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);
    
        res.json({RecentUser});
      } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
      }
    });



  
  module.exports = router;