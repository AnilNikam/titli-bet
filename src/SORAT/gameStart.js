const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const IdCounter = mongoose.model("idCounter")

const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require("../../logger");
const roundStartActions = require("./roundStart");
const walletActions = require("../SpinerGame/updateWallet");
const SoratTables = mongoose.model('soratTables');


const SoratUserHistory = mongoose.model('SoratUserHistory');
// const leaveTableActions = require("./leaveTable");
const _ = require("underscore")
module.exports.gameTimerStart = async (tb) => {
    try {
        logger.info("gameTimerStart tb : ", tb);
        if (tb.gameState != "" && tb.gameState != "WinnerDecalre") return false;

        let wh = {
            _id: tb._id,
            "playerInfo.seatIndex": { $exists: true }
        }
        let update = {
            $set: {
                gameState: "SoratGameStartTimer",
                "gameTimer.GST": new Date(),
                "totalbet": 0,
                "playerInfo.$.selectObj": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "selectObj": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                "isFinalWinner": false
            }
        }
        logger.info("gameTimerStart UserInfo : ", wh, update);

        const tabInfo = await SoratTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("gameTimerStart tabInfo :: ", tabInfo);

        //  let roundTime = 3;
        //  commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.SORAT_GAME_START_TIMER, { timer: roundTime,history:tabInfo.history});

        let tbId = tabInfo._id;
        //  let jobId = CONST.SORAT_GAME_START_TIMER + ":" + tbId;
        //  let delay = commandAcions.AddTime(roundTime);

        //  const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

        this.startSORAT(tbId, tabInfo.history)
    } catch (error) {
        logger.error("gameTimerStart.js error ->", error)
    }
}

module.exports.startSORAT = async (tbId, winnerHistory) => {

    try {

        const tb = await SoratTables.findOne({
            _id: MongoID(tbId.toString()),
        }, {})

        logger.info("startSORAT tbId : ", tbId);
        if (tb == null || tb.gameState != "SoratGameStartTimer") return false;


        //Genrate Rendom Number 
        //logger.info("startSORAT config.SORATLOGIC : ", config.SORATLOGIC);
        logger.info("startSORAT tb.totalbet : ", tb.totalbet);

       
        let wh = {
            _id: tbId
        }
        let update = {
            $set: {
                gameState: "StartSorat",
                //itemObject:itemObject,
                "gameTimer.GST": new Date()
            },
            // $push:{
            //     "history": {
            //         $each: [itemObject],
            //         $slice: -15
            //     }
            // }
        }
        logger.info("startSORAT UserInfo : ", wh, update);

        const tabInfo = await SoratTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("startSORAT tabInfo :: ", tabInfo);

        commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.STARTSORAT, { itemObject: "", timelimit: 20, History: winnerHistory });

        setTimeout(async () => {
            // Clear destory 

            const Tabledata = await SoratTables.findOne({
                _id: MongoID(tbId.toString()),
            }, {})

            // NORMAL 
            let itemObject = Tabledata.TableObject[getRandomInt(0, Tabledata.TableObject.length - 1)]

            let totalzerobetobject = []
            let nonZeroNumbers = []
            console.log("Tabledata.selectObj", Tabledata.selectObj)


            Tabledata.selectObj.forEach((value, index) => {
                if (value === 0) {
                    totalzerobetobject.push(index);
                } else {
                    nonZeroNumbers.push(value)
                }
            });

          

            console.log("totalzerobetobject .SORAT ", totalzerobetobject)

            //_.min(Tabledata.selectObj)
            let minimumbet = Tabledata.selectObj.indexOf(_.min(nonZeroNumbers))
            let maxmumbet = Tabledata.selectObj.indexOf(_.max(Tabledata.selectObj))

            console.log("GAMELOGICCONFIG.SORAT ", GAMELOGICCONFIG.SORAT)

            console.log("Tabledata.TableObject ", Tabledata.TableObject)

            console.log("minimumbet ", minimumbet)
            console.log("maxmumbet ", maxmumbet)

            if (GAMELOGICCONFIG.SORAT == "Client") { // Client SIDE
                if (totalzerobetobject.length > 0) {
                    itemObject = Tabledata.TableObject[totalzerobetobject[getRandomInt(0, totalzerobetobject.length - 1)]]
                } else {
                    itemObject = Tabledata.TableObject[minimumbet]
                }
            } else if (GAMELOGICCONFIG.SORAT == "HighUser") {  // User SIDE
                itemObject = Tabledata.TableObject[maxmumbet]
            } else if (GAMELOGICCONFIG.SORAT == "LowUser") {
                itemObject = Tabledata.TableObject[minimumbet]
            }
            console.log("itemObject:::::::::::: ", itemObject)

            let wh = {
                _id: tbId
            }
            let update = {
                $set: {
                    itemObject: ""
                },
                $push: {
                    "history": {
                        $each: [itemObject],
                        $slice: -50
                    }
                }
            }
            logger.info("startSORAT UserInfo : ", wh, update);

            const tabInfonew = await SoratTables.findOneAndUpdate(wh, update, { new: true });
            logger.info("startSORAT tabInfonew :: ", tabInfonew);




            this.winnerSorat(tabInfonew, itemObject);
        }, 22000);

        //botLogic.PlayRobot(tabInfo,tabInfo.playerInfo,itemObject)

    } catch (error) {
        logger.error("SoratTables.js error ->", error)
    }
}

// Generate a random whole number between a specified range (min and max)
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.winnerSorat = async (tabInfo, itemObject) => {

    try {
        logger.info("winnerSorat winner ::  -->", itemObject, tabInfo);
        let tbid = tabInfo._id.toString()
        logger.info("winnerSorat tbid ::", tbid);

        const tb = await SoratTables.findOne({
            _id: MongoID(tbid.toString()),
        }, {})

        if (typeof itemObject == "undefined" || (typeof tb != "undefined" && tb.playerInfo.length == 0)) {
            logger.info("winnerSorat winner ::", itemObject);
            return false;
        }

        if (tabInfo.gameState != "StartSorat") return false;
        if (tabInfo.isFinalWinner) return false;

        const upWh = {
            _id: MongoID(tbid.toString()),
        }
        const updateData = {
            $set: {
                "isFinalWinner": true,
                gameState: "WinnerDecalre",
            }
        };
        logger.info("winnerSorat upWh updateData :: ", upWh, updateData);

        const tbInfo = await SoratTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("winnerSorat tbInfo : ", tbInfo);

        let winnerData = [

        ]

        let itemIndex = tbInfo.TableObject.indexOf(itemObject)


        for (let i = 0; i < tbInfo.playerInfo.length; i++) {
            if (tbInfo.playerInfo[i].seatIndex != undefined) {
                var TotalWinAmount = 0
                if (tbInfo.playerInfo[i].selectObj[itemIndex] != 0) {
                    winnerData.push({
                        seatIndex: tbInfo.playerInfo[i].seatIndex,
                        winAmount: tbInfo.playerInfo[i].selectObj[itemIndex] * 10,
                        itemIndex: itemIndex
                    })

                    TotalWinAmount = tbInfo.playerInfo[i].selectObj[itemIndex] * 10;
                }
                console.log("tbInfo.playerInfo[i].selectObj[12] ", tbInfo.playerInfo[i].selectObj[12])
                console.log("tbInfo.playerInfo[i].selectObj[12]itemIndex  ", itemIndex)

                // Old  tem
                if (tbInfo.playerInfo[i].selectObj[12] != 0 && [0, 1, 2, 6, 7, 8].indexOf(itemIndex) != -1) {
                    winnerData.push({
                        seatIndex: tbInfo.playerInfo[i].seatIndex,
                        winAmount: tbInfo.playerInfo[i].selectObj[11] * 2,
                        itemIndex: 12
                    })

                    TotalWinAmount = TotalWinAmount + tbInfo.playerInfo[i].selectObj[12] * 2;
                }

                console.log("tbInfo.playerInfo[i].selectObj[13] ", tbInfo.playerInfo[i].selectObj[13])
                console.log("tbInfo.playerInfo[i].selectObj[13]itemIndex  ", itemIndex)

                // Old  tem
                if (tbInfo.playerInfo[i].selectObj[13] != 0 && [3, 4, 5, 9, 10, 11].indexOf(itemIndex) != -1) {
                    winnerData.push({
                        seatIndex: tbInfo.playerInfo[i].seatIndex,
                        winAmount: tbInfo.playerInfo[i].selectObj[12] * 2,
                        itemIndex: 13
                    })
                    TotalWinAmount = TotalWinAmount + tbInfo.playerInfo[i].selectObj[13] * 2;
                }

                console.log("TotalWinAmount ", TotalWinAmount)

                if (TotalWinAmount != 0) {

                    await walletActions.addWallet(tbInfo.playerInfo[i]._id, Number(TotalWinAmount), 4, "Sorat Win", tbInfo, tbInfo.playerInfo[i].sck, tbInfo.playerInfo[i].seatIndex, "SORAT");

                    const upWh = {
                        _id: MongoID(tbInfo._id.toString()),
                        "playerInfo.seatIndex": Number(tbInfo.playerInfo[i].seatIndex)
                    }

                    await SoratTables.findOneAndUpdate(upWh, { $inc: { "playerInfo.$.playerWinChips": TotalWinAmount } }, { new: true });

                }


                let insertobj = {
                    userId: tbInfo.playerInfo[i]._id.toString(),
                    ballposition: itemIndex,
                    beforeplaypoint: tbInfo.playerInfo[i].coins +  tbInfo.playerInfo[i].totalbet,
                    play: tbInfo.playerInfo[i].totalbet,
                    won: TotalWinAmount,
                    afterplaypoint: tbInfo.playerInfo[i].coins + TotalWinAmount,
                    uuid: tbInfo.gameId
                };
                console.log("SoratUserHistory ", insertobj)
                await SoratUserHistory.create(insertobj);

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

        const tbData = await SoratTables.findOne({
            _id: MongoID(tbid.toString()),
        }, {})
        commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.SORATWINNER, {
            WinnerData: winnerData,
            itemObject: itemObject,
            playerInfo: tbData.playerInfo
        });


        setTimeout(async () => {
            await this.gameTimerStart(tbInfo);
        }, 13000)
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


                await walletActions.deductWallet(playerInfo[i]._id, -Number(tabInfo.boot), 1, "Sorat Bet", tabInfo, playerInfo[i].sck, playerInfo[i].seatIndex, "SORAT");

                let update = {
                    $inc: {
                        "potValue": Number(tabInfo.boot),
                        "playerInfo.$.totalBet": Number(tabInfo.boot)
                    }
                }
                let uWh = { _id: MongoID(tabInfo._id.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                logger.info("deduct uWh update ::", uWh, update)
                await PlayingTables.findOneAndUpdate(uWh, update, { new: true });
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
                await PlayingTables.findOneAndUpdate(uWh, update, { new: true });
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