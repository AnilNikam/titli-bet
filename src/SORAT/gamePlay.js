const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
const SoratTables = mongoose.model('soratTables');

const walletActions = require("../SpinerGame/updateWallet");

/*
    bet : 10,
    object:{
        item:0, 
        bet:10,

        //  {name:"Ambarella",bet:0},
        //  {name:"Football",bet:0},
        //  {name:"Sun",bet:0},
        //  {name:"Lamp",bet:0},
        //  {name:"Dog",bet:0},
        //  {name:"Bucket",bet:0},
        //  {name:"kites",bet:0},
        //  {name:"Latto",bet:0},
        //  {name:"Rose",bet:0},
        //  {name:"Bird",bet:0},
        //  {name:"Rabbit",bet:0},
        //  {name:"1",bet:0},
        //  {name:"2",bet:0}
    }

*/
module.exports.actionslot = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined" || typeof requestData.bet == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.ACTION, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.action != "undefined" && client.action) return false;

        client.action = true;

        const wh = {
            _id: MongoID(requestData.tableId.toString()),
            status:{$ne:"StartSorat"}
        }
        const project = {

        }
        console.log("wh ",wh)
        const demotabledata = await SoratTables.findOne({_id: MongoID(requestData.tableId.toString())}, project).lean();

        console.log("demotabledata ",demotabledata)

        const tabInfo = await SoratTables.findOne(wh, project).lean();
        logger.info("action tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("action user not turn ::", tabInfo);
            delete client.action;
            return false
        }
       
        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        let currentBet = Number(requestData.bet);
       
        logger.info("action currentBet ::", currentBet);

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("action UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {

            },
            $inc:{
                
            }
        }
        let chalvalue = currentBet;
        updateData.$set["playerInfo.$.playStatus"] = "action"
    
        let totalWallet = Number(UserInfo.chips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("action client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.ACTIONSORAT, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "Solat Bet", tabInfo, client.id, client.seatIndex,"SORAT");

        updateData.$inc["playerInfo.$.selectObj."+requestData.item] = chalvalue;
        updateData.$inc["playerInfo.$.totalbet"] = chalvalue;


        updateData.$inc["totalbet"] = chalvalue;
        updateData.$inc["selectObj." + requestData.item] = chalvalue;
        updateData.$inc["playerInfo.$.coins"] = -chalvalue;

        //commandAcions.clearJob(tabInfo.job_id);jobId

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await SoratTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
            chalValue: chalvalue,
            item:requestData.item,
            playerInfo:tb.playerInfo
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.ACTIONSORAT, response);
        delete client.action;
        
        // let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
        // logger.info("action activePlayerInRound :", activePlayerInRound, activePlayerInRound.length);
        // if (activePlayerInRound.length == 1) {
        //     await gameFinishActions.lastUserWinnerDeclareCall(tb);
        // } else {
        //     await roundStartActions.nextUserTurnstart(tb);
        // }
        
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    bet : 10,
    object:{
        item:0, 
        bet:10,
    }

*/
module.exports.ClearBetSORAT = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.ClearBetSORAT, requestData, false, "User session not set, please restart game!");
            return false;
        }

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await SoratTables.findOne(wh, project).lean();
        logger.info("ClearBetSORAT tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("ClearBetSORAT user not turn ::", tabInfo);
           
            return false
        }
       
        
        let playerInfo = tabInfo.playerInfo[client.seatIndex];
       
        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("ClearBetSORAT UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {
                "playerInfo.$.selectObj":[0,0,0,0,0,0,0,0,0,0,0,0,0],
                "playerInfo.$.totalbet":0,
                
            },
            $inc:{
                "totalbet": -Number(playerInfo.totalbet),
                "playerInfo.$.coins":Number(playerInfo.totalbet)
               
            }
        }
        
       
        await walletActions.RefundaddWallet(client.uid, Number(playerInfo.totalbet), 4, "Sorat Clear Bet", tabInfo,client.id, client.seatIndex,"SORAT");

    
        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await SoratTables    .findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            flags:true
        }

        commandAcions.sendEvent(client, CONST.ClearBetSORAT, response, false, "");
        
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    bet : 10,
    object:{
        item:0, 
        bet:10,
    }

*/
module.exports.DoubleBetSORAT = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.DoubleBetSORAT, requestData, false, "User session not set, please restart game!");
            return false;
        }

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await SoratTables.findOne(wh, project).lean();
        logger.info("DoubleBetSORAT tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("DoubleBetSORAT user not turn ::", tabInfo);
           
            return false
        }
       
        
        let playerInfo = tabInfo.playerInfo[client.seatIndex];
       
        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("DoubleBetSORAT UserInfo : ", gwh, JSON.stringify(UserInfo));

        var chalvalue = playerInfo.selectObj.reduce((accumulator, currentValue) => {
            return accumulator + currentValue
        },0);
        
        console.log("chalvalue ",chalvalue)

        let totalWallet = Number(UserInfo.chips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("DoubleBetSORAT client.su ::", client.seatIndex);
            commandAcions.sendDirectEvent(client.sck, CONST.DoubleBetSORAT, requestData, false, "Please add wallet!!");
            return false;
        }


        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "Solat Bet", tabInfo, client.id, client.seatIndex,"SORAT");

        let updateData = {
            $set: {

            },
            $inc:{
                
            }
        }
        
        for (let i = 0; i < playerInfo.selectObj.length; i++ ) {
            if(playerInfo.selectObj[i] != 0){
                updateData.$inc["playerInfo.$.selectObj."+i] = playerInfo.selectObj[i];
            }
          }

        


        updateData.$inc["playerInfo.$.totalbet"] = chalvalue;
        updateData.$inc["playerInfo.$.coins"] = -chalvalue;

        updateData.$inc["totalbet"] = chalvalue;
        updateData.$set["turnDone"] = true;
        //commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await SoratTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            selectObj:tb.playerInfo[client.seatIndex].selectObj,
            totalbet:tb.playerInfo[client.seatIndex].totalbet

        }

        commandAcions.sendEvent(client, CONST.DoubleBetSORAT, response, false, "");

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


module.exports.GETHISTORYSORAT = async (requestData, client) => {
    try {
        logger.info("GETHISTORYSORAT requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.GETHISTORYSORAT, requestData, false, "User session not set, please restart game!");
            return false;
        }

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {
            history:1
        }
        const tabInfo = await SoratTables.findOne(wh, project).lean();
        logger.info("GETHISTORYSORAT tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("GETHISTORYSORAT user not turn ::", tabInfo);
           
            return false
        }
       
        commandAcions.sendEvent(client, CONST.GETHISTORYSORAT, {History:tabInfo.history}, false, "");

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}