const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
const SpinnerTables = mongoose.model('SpinnerTables');

const walletActions = require("./updateWallet");

/*
    bet : 10,
    object:{
        item:0, 
        bet:10,
    }

*/
module.exports.actionSpin = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined" || typeof requestData.bet == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.ACTIONSPINNNER, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.action != "undefined" && client.action) return false;

        client.action = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
            //status:"SpinnerGameStartTimer"
        }
        const project = {

        }
        const tabInfo = await SpinnerTables.findOne(wh, project).lean();
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
        let chalvalue =currentBet;
        updateData.$set["playerInfo.$.playStatus"] = "action"
    
        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("action client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.ACTIONSPINNNER, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "Spinner Bet", tabInfo, client.id, client.seatIndex,"Spinner");

        updateData.$inc["playerInfo.$.selectObj."+requestData.item] = chalvalue;
        updateData.$inc["playerInfo.$.totalbet"] = chalvalue;


        updateData.$inc["totalbet"] = chalvalue;
        updateData.$set["turnDone"] = true;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await SpinnerTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            bet: chalvalue,
            item:requestData.item
        }

        commandAcions.sendEvent(client, CONST.ACTIONSPINNNER, response, false, "");

      
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
module.exports.ClearBet = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.ClearBet, requestData, false, "User session not set, please restart game!");
            return false;
        }

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await SpinnerTables.findOne(wh, project).lean();
        logger.info("ClearBet tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("ClearBet user not turn ::", tabInfo);
           
            return false
        }
       
        
        let playerInfo = tabInfo.playerInfo[client.seatIndex];
       
        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("ClearBet UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {
                "playerInfo.$.selectObj":[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                "playerInfo.$.totalbet":0,
                
            },
            $inc:{
                "totalbet":-Number(playerInfo.totalbet)
            }
        }
        
       
        await walletActions.addWallet(client.uid, Number(playerInfo.totalbet), 4, "Spinnner Clear Bet", tabInfo,client.id, client.seatIndex,"Spinner");

    
        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await SpinnerTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            flags:true
        }

        commandAcions.sendEvent(client, CONST.ClearBet, response, false, "");
        
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
module.exports.DoubleBet = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.DoubleBet, requestData, false, "User session not set, please restart game!");
            return false;
        }

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await SpinnerTables.findOne(wh, project).lean();
        logger.info("DoubleBet tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("DoubleBet user not turn ::", tabInfo);
           
            return false
        }
       
        
        let playerInfo = tabInfo.playerInfo[client.seatIndex];
       
        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("DoubleBet UserInfo : ", gwh, JSON.stringify(UserInfo));

        var chalvalue = playerInfo.selectObj.reduce((accumulator, currentValue) => {
            return accumulator + currentValue
        },0);
        
        console.log("chalvalue ",chalvalue)

        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("DoubleBet client.su ::", client.seatIndex);
            commandAcions.sendDirectEvent(client.sck, CONST.DoubleBet, requestData, false, "Please add wallet!!");
            return false;
        }


        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "Spinner Bet", tabInfo, client.id, client.seatIndex,"Spinner");

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


        updateData.$inc["totalbet"] = chalvalue;
        updateData.$set["turnDone"] = true;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await SpinnerTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            selectObj:tb.playerInfo[client.seatIndex].selectObj,
            totalbet:tb.playerInfo[client.seatIndex].totalbet

        }

        commandAcions.sendEvent(client, CONST.DoubleBet, response, false, "");

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

module.exports.printMytranscation = async (requestData, client) => {


    if ( typeof client.uid == "undefined") {
        commandAcions.sendDirectEvent(client.sck, CONST.PSPINER, requestData, false, "User session not set, please restart game!");
        return false;
    }

    const TotalBetCount = await UserWalletTracks.find({userId:new mongoose.Types.ObjectId(client.uid),trnxType:"2",game:"Spinner"}).count()
    const TotalWinCount = await UserWalletTracks.find({userId:new mongoose.Types.ObjectId(client.uid),trnxType:"4",game:"Spinner"}).count()

     let response = { 
        agentName:"AgentInfo.name",
        date:new Date(),
        TotalBetCount:TotalBetCount,
        TotalWinCount:TotalWinCount
     }

    commandAcions.sendEvent(client, CONST.DoubleBet, response, false, "");

}

