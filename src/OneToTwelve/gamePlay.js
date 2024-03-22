const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
const SoratTables = mongoose.model('soratTables');
const roundStartActions = require("./roundStart");
const gameFinishActions = require("./gameFinish");
const checkWinnerActions = require("./checkWinner");
const checkUserCardActions = require("./checkUserCard");

const walletActions = require("./updateWallet");

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
module.exports.action = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined" || typeof requestData.bet == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.ONE_ACTION, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.action != "undefined" && client.action) return false;

        client.action = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
            status: "openforbet"
        }
        const project = {

        }
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
            $inc: {

            }
        }
        let chalvalue = tabInfo.currentBet;
        updateData.$set["playerInfo.$.playStatus"] = "action"

        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("action client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.ONE_ACTION, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "OnetoTwelve Bet", tabInfo, client.id, client.seatIndex);

        updateData.$inc["playerInfo.$.selectObj." + item] = chalvalue;
        updateData.$inc["playerInfo.$.totalbet"] = chalvalue;

        updateData.$inc["totalbet"] = chalvalue;
        updateData.$set["turnDone"] = true;

        commandAcions.clearJob(tabInfo.job_id);

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
            item: item
        }

        sendEvent(client, CONST.ONE_ACTION, response, false, "");

        delete client.action;
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}