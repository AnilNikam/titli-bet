const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const SoratTables = mongoose.model('soratTables');
const { sendEvent, sendDirectEvent, AddTime, setDelay, clearJob } = require('../helper/socketFunctions');
const _ = require("underscore")
const gameStartActions = require("./gameStart");
const CONST = require("../../constant");
const logger = require("../../logger");
const botLogic = require("./botLogic");


module.exports.SORAT_JOIN_TABLE = async (requestData, client) => {
    try {
        if (typeof client.uid == "undefined") {
            sendEvent(client, CONST.SORAT_JOIN_TABLE, requestData, false, "Please restart game!!");
            return false;
        }
        if (typeof client.JT != "undefined" && client.JT) return false;

        client.JT = true;

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("JoinTable UserInfo : ", gwh, JSON.stringify(UserInfo));

        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)
        if (Number(totalWallet) < 1) {
            sendEvent(client, CONST.SORAT_JOIN_TABLE, requestData, false, "Please add Wallet!!");
            delete client.JT
            return false;
        }

        let gwh1 = {
            "playerInfo._id": MongoID(client.uid)
        }
        let tableInfo = await SoratTables.findOne(gwh1, {}).lean();
        logger.info("JoinTable tableInfo : ", gwh, JSON.stringify(tableInfo));

        if (tableInfo != null) {
            sendEvent(client, CONST.SORAT_JOIN_TABLE, requestData, false, "Already In playing table!!");
            delete client.JT
            return false;
        }
        await this.findTable( client)
    } catch (error) {
        console.info("SORAT_JOIN_TABLE", error);
    }
}

module.exports.findTable = async (client) => {
    logger.info("findTable  : ");

    let tableInfo = await this.getBetTable();
    logger.info("findTable tableInfo : ", JSON.stringify(tableInfo));
    console.log("tableInfo ",tableInfo)
    await this.findEmptySeatAndUserSeat(tableInfo, client);
}

module.exports.getBetTable = async () => {
    logger.info("getBetTable  : ");
    // let wh = {
    //     activePlayer: { $gte: 1}
    // }
    // logger.info("getBetTable wh : ", JSON.stringify(wh));
    // let tableInfo = await SoratTables.find(wh, {}).sort({ activePlayer: 1 }).lean();

    // if (tableInfo.length > 0) {
    //     return tableInfo[0];
    // }
    let table = await this.createTable({});
    return table;
}

module.exports.createTable = async () => {
    try {
        let insertobj = {
            gameId: "",
            activePlayer: 0,
            playerInfo: [{}],
            gameState: "",
            history:_.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,5,6]),
            betamount:[10,50,100,200],
            TableObject:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            selectObj:[0,0,0,0,0,0,0,0,0,0,0,0]
        };
        logger.info("createTable insertobj : ", insertobj);

        let insertInfo = await SoratTables.create(insertobj);
        logger.info("createTable insertInfo : ", insertInfo);

        return insertInfo;

    } catch (error) {
        logger.error('joinTable.js createTable error=> ', error);

    }
}

module.exports.findEmptySeatAndUserSeat = async (table, client) => {
    try {
        logger.info("findEmptySeatAndUserSeat table :=> ", table + " client :=> ", client);
        let seatIndex = this.findEmptySeat(table.playerInfo); //finding empty seat
        logger.info("findEmptySeatAndUserSeat seatIndex ::", seatIndex);

        if (seatIndex == "-1") {
            await this.findTable(client)
            return false;
        }

        let user_wh = {
            _id: client.uid
        }
        console.log("user_wh ",user_wh)
        let userInfo = await GameUser.findOne(user_wh, {}).lean();
        logger.info("findEmptySeatAndUserSeat userInfo : ", userInfo)

        // let wh = {
        //     _id : table._id.toString()
        // };
        // let tbInfo = await SoratTables.findOne(wh,{}).lean();
        // logger.info("findEmptySeatAndUserSeat tbInfo : ", tbInfo)
        let totalWallet = Number(userInfo.chips) 
        let playerDetails = {
            seatIndex: seatIndex,
            _id: userInfo._id,
            playerId: userInfo._id,
            username: userInfo.username,
            profile: userInfo.profileUrl,
            coins: totalWallet,
            status: "",
            playerStatus: "",
            selectObj: [
                0,0,0,0,0, 
                0,0,0,0,0,
                0,0,0,0
            ], // Select object enter ,
            totalbet:0,
            turnMissCounter: 0,
            turnCount: 0,
            sck: client.id,
            playerSocketId: client.id,
            playerLostChips: 0,
            playerWinChips: 0,
            Iscom:userInfo.Iscom != undefined ? userInfo.Iscom:0,

        }

        // {name:"Ambarella",bet:0},
        //         {name:"Football",bet:0},
        //         {name:"Sun",bet:0},
        //         {name:"Lamp",bet:0},
        //         {name:"Dog",bet:0},
        //         {name:"Bucket",bet:0},
        //         {name:"kites",bet:0},
        //         {name:"Latto",bet:0},
        //         {name:"Rose",bet:0},
        //         {name:"Bird",bet:0},
        //         {name:"Rabbit",bet:0},
        //         {name:"1",bet:0},
        //         {name:"2",bet:0},

        logger.info("findEmptySeatAndUserSeat playerDetails : ", playerDetails);

        let whereCond = {
            _id: MongoID(table._id.toString())
        };
        whereCond['playerInfo.' + seatIndex + '.seatIndex'] = { $exists: false };

        let setPlayerInfo = {
            $set: {
                gameState: ""
            },
            $inc: {
                activePlayer: 1
            }
        };
        setPlayerInfo["$set"]["playerInfo." + seatIndex] = playerDetails;

        logger.info("findEmptySeatAndUserSeat whereCond : ", whereCond, setPlayerInfo);

        let tableInfo = await SoratTables.findOneAndUpdate(whereCond, setPlayerInfo, { new: true });
        logger.info("\nfindEmptySeatAndUserSeat tbInfo : ", tableInfo);

        let playerInfo = tableInfo.playerInfo[seatIndex];

        if (!(playerInfo._id.toString() == userInfo._id.toString())) {
            await this.findTable(client);
            return false;
        }
        client.seatIndex = seatIndex;
        client.tbid = tableInfo._id;

        logger.info('\n Assign table id and seat index socket event ->', client.seatIndex, client.tbid);
        let diff = -1;

        if (tableInfo.activePlayer >= 2 && tableInfo.gameState === CONST.SORAT_ROUND_START_TIMER) {
            let currentDateTime = new Date();
            let time = currentDateTime.getSeconds();
            let turnTime = new Date(tableInfo.gameTimer.GST);
            let Gtime = turnTime.getSeconds();

            diff = Gtime - time;
            diff += CONST.gameStartTime;
        }

        sendEvent(client, CONST.SORAT_JOIN_TABLE , {}); //JOIN_SIGN_UP

        //GTI event
        sendEvent(client, CONST.SORAT_GAME_TABLE_INFO, {
            ssi: tableInfo.playerInfo[seatIndex].seatIndex,
            gst: diff,
            pi: tableInfo.playerInfo,
            utt: CONST.userTurnTimer,
            fns: CONST.finishTimer,
            tableid: tableInfo._id,
            gamePlayType: tableInfo.gamePlayType,
            type: tableInfo.gamePlayType,
            openDecks: tableInfo.openDeck,
            tableAmount: tableInfo.tableAmount,
        });

        if(userInfo.Iscom == undefined || userInfo.Iscom == 0)
        client.join(tableInfo._id.toString());

        sendDirectEvent(client.tbid.toString(), CONST.JOIN_TABLE, {
            ap: tableInfo.activePlayer,
            playerDetail: tableInfo.playerInfo[seatIndex],
        });

        delete client.JT;

        if (tableInfo.gameState == "") {

            let jobId = "LEAVE_SINGLE_USER:" + tableInfo._id;
            clearJob(jobId)

            await gameStartActions.gameTimerStart(tableInfo);
        }else{

            if(tableInfo.activePlayer <= 2){
                setTimeout(()=>{
                    botLogic.JoinRobot(tableInfo)
                },2000)
            }
        }
  
        //}
    } catch (error) {
        console.info("findEmptySeatAndUserSeat", error);
    }
}

module.exports.findEmptySeat = (playerInfo) => {
    for (x in playerInfo) {
        if (typeof playerInfo[x] == 'object' && playerInfo[x] != null && typeof playerInfo[x].seatIndex == 'undefined') {
            return parseInt(x);
            break;
        }
    }
    return '-1';
}