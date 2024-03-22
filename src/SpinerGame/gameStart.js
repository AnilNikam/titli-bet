const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const IdCounter = mongoose.model("idCounter")

const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require("../../logger");
const roundStartActions = require("./roundStart");
const walletActions = require("./updateWallet");
const SpinnerTables = mongoose.model('SpinnerTables');
// const leaveTableActions = require("./leaveTable");
const { v4: uuidv4 } = require('uuid');

module.exports.gameTimerStart = async (tb) => {
    try {
        logger.info("gameTimerStart tb : ", tb);
        if (tb.gameState != "" && tb.gameState != "WinnerDecalre") return false;

        let wh = {
            _id:MongoID(tb._id),
            "playerInfo._id": {$exists:true}
        }
        let update = {
            $set: {
                gameState: "SpinnerGameStartTimer",
                "gameTimer.GST": new Date(),
                "totalbet":0,
                "playerInfo.$.selectObj":[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                "isFinalWinner":false,
                uuid: uuidv4(),
            }
        }
        logger.info("gameTimerStart UserInfo : ", wh, update);

        const tabInfo = await SpinnerTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("gameTimerStart tabInfo :: ", tabInfo);

        let roundTime = 10;
        commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.GAME_START_TIMER, { timer: roundTime,history:tabInfo.history });

        let tbId = tabInfo._id;
        let jobId = CONST.GAME_START_TIMER + ":" + tbId;
        let delay = commandAcions.AddTime(roundTime);

        const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

        setTimeout(async ()=>{
            this.StartSpinnerGame(tbId)
        },2000)

        

    } catch (error) {
        logger.error("gameTimerStart.js error ->", error)
    }
}

module.exports.StartSpinnerGame = async (tbId) => {

    try {

        const tb = await SpinnerTables.findOne({
            _id: MongoID(tbId.toString()),
        }, {})

        logger.info("StartSpinnerGame tbId : ", tb);
        if (tb == null || tb.gameState != "SpinnerGameStartTimer") return false;


        //Genrate Rendom Number 
        logger.info("StartSpinnerGame GAMELOGICCONFIG.SPIN : ", GAMELOGICCONFIG.SPIN);
        logger.info("StartSpinnerGame tb.totalbet : ", tb.TableObject);

        // NORMAL 
        let itemObject = tb.TableObject[this.getRandomInt(0,tb.TableObject.length-1)]

        // if(CONST.SORATLOGIC == "Client"){ // Client SIDE
        //     if(tb.totalbet >= 5){
        //          Number = this.generateNumber()
        //     }else if(tb.totalbet < 5){
        //          Number = this.generateNumber()
        //     }
        // }else if(CONST.SORATLOGIC == "User"){  // User SIDE
        //      Number = this.generateNumber()
        // }   
        console.log("itemObject ",itemObject)
        
        let wh = {
            _id: tbId
        }
        let update = {
            $set: {
                gameState: "StartSpinner",
                itemObject:itemObject,
                turnStartTimer:new Date()
            },
            $push:{
                "history": {
                    $each: [itemObject],
                    $slice: -7
                }
            }
        }
        logger.info("startSpinner UserInfo : ", wh, update);

        const tabInfo = await SpinnerTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("startSpinner tabInfo :: ", tabInfo);

        commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.STARTSPINNER, { itemObject: itemObject,timelimit:10 });

        setTimeout(async ()=> {
            // Clear destory 
            // const tabInfonew = await SpinnerTables.findOneAndUpdate(wh, {
            //     $set: {
            //         gameState: "",
            //         itemObject:""
            //     }
            // }, { new: true });

            this.winnerSpinner(tabInfo,itemObject);
        },10000);

        //botLogic.PlayRobot(tabInfo,tabInfo.playerInfo,itemObject)

    } catch (error) {
        logger.error("SpinnerTables.js error ->", error)
    }
}       

// Generate a random whole number between a specified range (min and max)
module.exports.getRandomInt = (min, max) =>{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.winnerSpinner = async (tabInfo, itemObject) =>{

    try {
        logger.info("winnerSorat winner ::  -->", itemObject, tabInfo);
        let tbid = tabInfo._id.toString()
        logger.info("winnerSorat tbid ::", tbid);

        const tb = await SpinnerTables.findOne({
            _id: MongoID(tbid.toString()),
        }, {})
        console.log("winnerSpinner tb ",tb)
        if (typeof itemObject == "undefined" || (typeof tb != "undefined" && tb.playerInfo.length == 0)) {
            logger.info("winnerSpinner winner ::", itemObject);
            logger.info("winnerSpinner winner tb.playerInfo.length ::", tb.playerInfo.length);

            return false;
        }

        if (tabInfo.gameState != "StartSpinner") return false;
        if (tabInfo.isFinalWinner) return false;

        const upWh = {
            _id: tbid
        }
        const updateData = {
            $set: {
                "isFinalWinner": true,
                gameState: "WinnerDecalre",
            }
        };
        logger.info("winnerSorat upWh updateData :: ", upWh, updateData);

        const tbInfo = await SpinnerTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("winnerSorat tbInfo : ", tbInfo);

        let winnerData = [

        ]

        let itemIndex = tbInfo.TableObject.indexOf(itemObject)
        console.log("itemIndex ",itemIndex)
        for (let i = 0; i < tbInfo.playerInfo.length; i++) {
            if(tbInfo.playerInfo[i].seatIndex != undefined){

                var TotalWinAmount = 0 
                if(tbInfo.playerInfo[i].selectObj[itemIndex] != 0){
                    winnerData.push({
                        uid:tbInfo.playerInfo[i]._id,
                        seatIndex:tbInfo.playerInfo[i].seatIndex,
                        winAmount:tbInfo.playerInfo[i].selectObj[itemIndex] * 10,
                    })

                    TotalWinAmount = tbInfo.playerInfo[i].selectObj[itemIndex] * 10;
                }
                // Old  tem
                if(tbInfo.playerInfo[i].selectObj[10] != 0 && itemIndex%2 == 1){
                    winnerData.push({
                        uid:tbInfo.playerInfo[i]._id,
                        seatIndex:tbInfo.playerInfo[i].seatIndex,
                        winAmount:tbInfo.playerInfo[i].selectObj[11] * 2,
                    })

                    TotalWinAmount = TotalWinAmount + tbInfo.playerInfo[i].selectObj[11] * 2;
                }

                // Old  tem
                if(tbInfo.playerInfo[i].selectObj[11] != 0 && itemIndex%2 == 0){
                    winnerData.push({
                        uid:tbInfo.playerInfo[i]._id,
                        seatIndex:tbInfo.playerInfo[i].seatIndex,
                        winAmount:tbInfo.playerInfo[i].selectObj[12] * 2,
                    })
                    TotalWinAmount = TotalWinAmount + tbInfo.playerInfo[i].selectObj[12] * 2;
                }

                // Old  tem
                if(tbInfo.playerInfo[i].selectObj[12] != 0 && [5,0,9,1].indexOf(itemIndex) != -1){
                    winnerData.push({
                        uid:tbInfo.playerInfo[i]._id,
                        seatIndex:tbInfo.playerInfo[i].seatIndex,
                        winAmount:tbInfo.playerInfo[i].selectObj[11] * 2,
                    })

                    TotalWinAmount = TotalWinAmount + tbInfo.playerInfo[i].selectObj[11] * 2;
                }

                // Old  tem
                if(tbInfo.playerInfo[i].selectObj[13] != 0 && [8,4,7,3].indexOf(itemIndex) != -1){
                    winnerData.push({
                        uid:tbInfo.playerInfo[i]._id,
                        seatIndex:tbInfo.playerInfo[i].seatIndex,
                        winAmount:tbInfo.playerInfo[i].selectObj[12] * 2,
                    })
                    TotalWinAmount = TotalWinAmount + tbInfo.playerInfo[i].selectObj[12] * 2;
                }

                console.log("TotalWinAmount ",TotalWinAmount)

                TotalWinAmount != 0 && await walletActions.addWallet(tbInfo.playerInfo[i]._id, Number(TotalWinAmount), 4, "Spinnner Win", tabInfo,"","","Spinner");
            }
        }
        const playerInGame = await roundStartActions.getPlayingUserInRound(tbInfo.playerInfo);
        logger.info("getWinner playerInGame ::", playerInGame);

        

        //const winnerTrack = await gameTrackActions.gamePlayTracks(winnerIndexs, tbInfo.gameTracks, tbInfo);
        //logger.info("winnerDeclareCall winnerTrack:: ", winnerTrack);

        // for (let i = 0; i < tbInfo.gameTracks.length; i++) {
        //     if (tbInfo.gameTracks[i].playStatus == "win") {
        //         await walletActions.addWallet(tbInfo.gameTracks[i]._id, Number(winnerTrack.winningAmount), 4, "Sorat Win", tabInfo);
        //     }
        // }

      
        commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.SPINNERWINNER, {
            WinnerData:winnerData,
            itemObject:itemObject
        });

        let jobId = CONST.BNW_GAME_START_TIMER + ":" + tbInfo._id.toString();
        let delay = commandAcions.AddTime(5);

        const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

        await this.gameTimerStart(tbInfo);

    } catch (err) {
        logger.info("Exception  WinnerDeclareCall : 1 :: ", err)
    }

}


//===================
module.exports.deduct = async (tabInfo, playerInfo) => {
    try {

        logger.info("\ndeduct playerInfo :: ", playerInfo);
        let seatIndexs = [];
        for (let i = 0; i < playerInfo.length; i++) {
            if (playerInfo[i] != {} && typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play") {
                seatIndexs.push(playerInfo[i].seatIndex);

                await walletActions.deductWallet(playerInfo[i]._id,-Number(tabInfo.boot), 1, "Sorat Bet", tabInfo, playerInfo[i].sck, playerInfo[i].seatIndex,"Spinner");

                let update = {
                    $inc: {
                        "potValue": Number(tabInfo.boot),
                        "playerInfo.$.totalBet": Number(tabInfo.boot)
                    }
                }
                let uWh = { _id: MongoID(tabInfo._id.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                logger.info("deduct uWh update ::", uWh, update)
                await SpinnerTables.findOneAndUpdate(uWh, update, { new: true });
            }
        }
        return seatIndexs
    } catch (error) {
        logger.error("deduct error ->", error)
    }
}

module.exports.resetUserData = async (tbId, playerInfo) => {
    try {

        for (let i = 0; i < playerInfo.length; i++)
            if (typeof playerInfo[i].seatIndex != "undefined") {
                let update = {
                    $set: {
                        "playerInfo.$.status": "play",
                        "playerInfo.$.playStatus": "blind",
                        "playerInfo.$.chalValue": 0,
                        "playerInfo.$.cards": [],
                        "playerInfo.$.turnMissCounter": 0,
                        "playerInfo.$.turnDone": false,
                        "playerInfo.$.turnCount": 0,
                    }
                }
                playerInfo[i].status = "play";
                let uWh = { _id: MongoID(tbId.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                logger.info("updateUserState uWh update ::", uWh, update)
                await SpinnerTables.findOneAndUpdate(uWh, update, { new: true });
            }

        logger.info("updateUserState playerInfo::", playerInfo, playerInfo.length);
        let playerInfos = await roundStartActions.getPlayingUserInRound(playerInfo);
        logger.info("updateUserState playerInfos::", playerInfos)
        return playerInfos;
    } catch (error) {
        logger.error("resetUserData error ->", error)
    }
}

module.exports.checkUserInRound = async (playerInfo, tb) => {
    try {

        let userIds = [];
        let userSeatIndexs = {};
        for (let i = 0; i < playerInfo.length; i++) {
            userIds.push(playerInfo[i]._id);
            userSeatIndexs[playerInfo[i]._id.toString()] = playerInfo[i].seatIndex;
        }
        logger.info("checkUserState userIds ::", userIds, userSeatIndexs);
        let wh = {
            _id: {
                $in: userIds
            }
        }
        let project = {
            chips: 1,
            winningChips: 1,
            sck: 1,
        }
        let userInfos = await GameUser.find(wh, project);
        logger.info("checkUserState userInfos :: ", userInfos);

        let userInfo = {};

        for (let i = 0; i < userInfos.length; i++)
            if (typeof userInfos[i]._id != "undefined") {
                let totalWallet = Number(userInfos[i].chips) + Number(userInfos[i].winningChips)
                userInfo[userInfos[i]._id] = {
                    coins: totalWallet,
                }
            }

        for (let i = 0; i < userInfos.length; i++)
            if (typeof userInfos[i]._id != "undefined") {
                if (Number(userInfo[userInfos[i]._id.toString()].coins) < (Number(tb.boot))) {
                    await leaveTableActions.leaveTable({
                        reason: "wallet_low"
                    }, {
                        _id: userInfos[i]._id.toString(),
                        tbid: tb._id.toString(),
                        seatIndex: userSeatIndexs[userInfos[i]._id.toString()],
                        sck: userInfos[i].sck,
                    })
                    //delete index frm array
                    playerInfo.splice(userSeatIndexs[userInfos[i]._id.toString()], 1);
                    delete userSeatIndexs[userInfos[i]._id.toString()];
                }
            }

        return playerInfo;
    } catch (error) {
        logger.error("checkUserInRound error ->", error)
    }
}

module.exports.getCount = async (type) => {
    let wh = {
        type: type
    }
    let update = {
        $set: {
            type: type
        },
        $inc: {
            counter: 1
        }
    }
    logger.info("\ngetUserCount wh : ", wh, update);

    let resp2 = await IdCounter.findOneAndUpdate(wh, update, { upsert: true, new: true });
    return resp2.counter;
}