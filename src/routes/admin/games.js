const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');
const fs = require("fs")

/**
* @api {get} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/rummyGameHistory', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const gameHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "GRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "GRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "GRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ]
        
        //await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/dahboard.js post dahboard  error => ', gameHistoryData);

        res.json({ gameHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/ludoGameHistory', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const gameHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "LRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "LRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "LRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ]
        
        //await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/dahboard.js post dahboard  error => ', gameHistoryData);

        res.json({ gameHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/gameLogicSet', async (req, res) => {
    try {
        console.info('requet => ', req.body);
        // console.log("req.body.gamelogic", CONST.AVIATORLOGIC)

        console.log("dddddddddddddddddddd 1", process.env.AVIATORLOGIC)

        console.log("req.body.game.gamename  1", req.body.game.gameName )
      
        if (req.body.game.gameName == "SORAT") {
            GAMELOGICCONFIG.SORAT = req.body.gamelogic

            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG)

            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        } else if (req.body.game.gameName == "SPIN") {
            GAMELOGICCONFIG.SPIN = req.body.gamelogic


            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        }else if (req.body.game.gameName == "ANDARBAHAR") {
            GAMELOGICCONFIG.ANDARBAHAR = req.body.gamelogic

            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG)

            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        } else if (req.body.game.gameName == "WHEELOFFORTUNE") {
            GAMELOGICCONFIG.WHEELOFFORTUNE = req.body.gamelogic


            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        }else if (req.body.game.gameName == "BARAKADUM") {
            GAMELOGICCONFIG.BARAKADUM = req.body.gamelogic

            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG)

            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        } else if (req.body.game.gameName == "ROULETTE") {
            GAMELOGICCONFIG.ROULETTE = req.body.gamelogic


            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        }


        res.json({ falgs: true });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/getgamelogic', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        // console.log("req.body.gamelogic", CONST.AVIATORLOGIC)

        console.log("dddddddddddddddddddd 1", process.env.AVIATORLOGIC)

        console.log("req.query.gameName", req.query.gamename )
        //"SORAT":"Client","SPIN":"Normal","":"","":"","":"","":"",
        if (req.query.gamename == "SORAT") {
          
            res.json({ logic: GAMELOGICCONFIG.SORAT });

        } else if (req.query.gamename == "SPIN") {
            

            res.json({ logic: GAMELOGICCONFIG.SPIN });

        }else if (req.query.gamename == "ANDARBAHAR") {
            

            res.json({ logic: GAMELOGICCONFIG.ANDARBAHAR });

        }else if (req.query.gamename == "WHEELOFFORTUNE") {
            

            res.json({ logic: GAMELOGICCONFIG.WHEELOFFORTUNE });

        }else if (req.query.gamename == "BARAKADUM") {
            

            res.json({ logic: GAMELOGICCONFIG.BARAKADUM });

        }else if (req.query.gamename == "ROULETTE") {
            

            res.json({ logic: GAMELOGICCONFIG.ROULETTE });

        }else{
            res.json({ logic: "" });
        }

        logger.info('admin/dahboard.js post dahboard  error => ', CONST);

        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});




//========================

/**
* @api {get} /admin/GameComSet
* @apiName  GameComSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/GameComSet', async (req, res) => {
    try {
        console.info('requet => ', req.body);
        // console.log("req.body.gamelogic", CONST.Commission)

        console.log("dddddddddddddddddddd 1", process.env.Commission)

        GAMELOGICCONFIG.AdminCommission = parseInt(req.body.selectedcom)
        GAMELOGICCONFIG.AgentCommission = parseInt(req.body.agentselectedcom)
        GAMELOGICCONFIG.ShopCommission = parseInt(req.body.shopselectedcom)

        console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG)

        let link = "./gamelogic.json"
        console.log("link ", link)
        fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
            console.log("erre", err)
            if (err) {
                console.log(err);
            }

        });

        res.json({ falgs: true });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/getgamecom', async (req, res) => {
    try {
        console.info('requet => ', req.query);
      
        console.log("dddddddddddddddddddd 1", process.env.Commission)

        res.json({ admincommission: parseInt(GAMELOGICCONFIG.AdminCommission),
                    agentcommission: parseInt(GAMELOGICCONFIG.AgentCommission),
                    shopcommission: parseInt(GAMELOGICCONFIG.ShopCommission)
                });

        logger.info('admin/dahboard.js post dahboard  error => ', CONST);

        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


module.exports = router;