const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const SpinnerTables = mongoose.model('SpinnerTables');

const UserWalletTracks = mongoose.model("userWalletTracks");
const GameUser = mongoose.model("users");

const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require("../../logger");

module.exports.deductWallet = async (id, deductChips, tType, t, tbInfo, client, seatIndex,game) => {
    try {
        logger.info('\ndedudctWallet : call.-->>>', id, deductChips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };

        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return 0;
        }

        deductChips = Number(deductChips.toFixed(2));
        let projection = {
            id: 1,
            username: 1,
            uniqueId: 1,
            chips: 1,
            winningChips: 1,
            sckId: 1,
            flags: 1
        }

        const userInfo = await GameUser.findOne(wh, projection);
        logger.info("dedudctWallet userInfo : ", userInfo);

        if (userInfo == null) {
            return false;
        }
        logger.info("dedudctWallet userInfo :: ", userInfo);

        userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
        //userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

        //let opGameWinning = userInfo.winningChips;
        let opChips = userInfo.chips;


        logger.info("userInfo.chips =>", userInfo.chips)
        //logger.info("userInfo.winningChips =>", userInfo.winningChips)

        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = deductChips;

        // if (userInfo.winningChips > 0 && deductChips < 0) {

        //     setInfo['$inc']['winningChips'] = (userInfo.winningChips + deductChips) >= 0 ? Number(deductChips) : Number(-userInfo.winningChips);
        //     setInfo['$inc']['winningChips'] = Number(setInfo['$inc']['winningChips'].toFixed(2))

        //     let winningChips = userInfo.winningChips;

        //     userInfo.winningChips = (userInfo.winningChips + deductChips) >= 0 ? (Number(userInfo.winningChips) + Number(deductChips)) : 0;
        //     userInfo.winningChips = Number(Number(userInfo.winningChips).toFixed(2));

        //     deductChips = (deductChips + userInfo.winningChips) >= 0 ? 0 : (Number(deductChips) + Number(winningChips));
        //     deductChips = Number(Number(deductChips).toFixed(2));
        // }

        if (userInfo.chips > 0 && deductChips < 0) {

            setInfo['$inc']['chips'] = (userInfo.chips + deductChips) >= 0 ? Number(deductChips) : Number(-userInfo.chips);
            setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2))

            let chips = userInfo.chips;

            userInfo.chips = (userInfo.chips + deductChips) >= 0 ? (Number(userInfo.chips) + Number(deductChips)) : 0;
            userInfo.chips = Number(Number(userInfo.chips).toFixed(2));

            deductChips = (deductChips + userInfo.chips) >= 0 ? 0 : (Number(deductChips) + Number(chips));
            deductChips = Number(Number(deductChips).toFixed(2));
        }

        logger.info("\ndedudctWallet setInfo :: --->", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("dedudctWallet userInfo :: ==>", userInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\ndedudctWallet wh :: ", wh, setInfo);
        let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\ndedudctWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        //upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
        let totalRemaningAmount = upReps.chips //+ upReps.winningChips;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                id: userInfo.id,
                uniqueId: userInfo.unique_id,
                userId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                oppWinningChips: upReps.winningChips,
                chips: upReps.chips,
                winningChips: upReps.winningChips,
                totalBucket: totalRemaningAmount,
                depositId: (tbInfo && tbInfo.depositId) ? tbInfo.depositId : "",
                withdrawId: (tbInfo && tbInfo.withdrawId) ? tbInfo.withdrawId : "",
                gameId: (tbInfo && tbInfo.gameId) ? tbInfo.game_id : "",
                isRobot: (typeof userInfo.flags != "undefined" && userInfo.flags.isRobot) ? userInfo.flags.isRobot : 0,
                gameType: (game) ? game : "", //Game Type
                maxSeat: (tbInfo && tbInfo.maxSeat) ? tbInfo.maxSeat : 0,//Maxumum Player.
                betValue: (tbInfo && tbInfo.betValue) ? tbInfo.betValue : 0,
                tableId: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
            }
            await this.trackUserWallet(walletTrack);
        }

        if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) 

        //|| (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)

        ) {

            let updateData = {
                $set: {}
            }
            updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

            //updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

            if (Object.keys(updateData.$set).length > 0) {
                let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
                logger.info("\ndedudctWallet upRepss  :: ", upRepss);
            }
        }

        logger.info(" userInfo.sckId.toString() => ", userInfo.sckId)
        logger.info(" upReps userInfo.sckId => ", upReps.sckId)
        logger.info(" client userInfo.sckId => ", client)

        // commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.WALLET_UPDATE, {
        //     winningChips: upReps.winningChips,
        //     chips: upReps.chips,
        //     totalWallet: totalRemaningAmount,
        //     msg: t,
        //     seatIndex: seatIndex
        // });

        commandAcions.sendDirectEvent(client, CONST.WALLET_UPDATE, {
            winningChips: upReps.winningChips,
            chips: upReps.chips,
            totalWallet: totalRemaningAmount,
            msg: t,
            seatIndex: seatIndex,
            deduct:1
        });


        // if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined" && typeof tbInfo.gt != "undefined" && tbInfo.gt == "Points Rummy") {
        //     if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
        //         for (let i = 0; i < tbInfo.pi.length; i++) {
        //             if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

        //                 let uChips = Number(upReps.chips) //+ Number(upReps.winningChips)

        //                 let tbWh = {
        //                     _id: MongoID(tbInfo._id.toString()),
        //                     "playerInfo._id": MongoID(wh._id.toString())
        //                 }

        //                 await SpinnerTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

        //                 commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.TABLE_USER_WALLET_UPDATE, {
        //                     totalWallet: uChips,
        //                     seatIndex: tbInfo.playerInfo[i].seatIndex
        //                 });
        //                 break;
        //             }
        //         }
        //     }
        // }
        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}

module.exports.RefundaddWallet = async (id, added_chips, tType, t, tbInfo, client, seatIndex,game) => {
    try { 
        logger.info('addWallet : call.-->>>', id, added_chips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return false;
        }
        added_chips = Number(added_chips.toFixed(2));
        let projection = {
            id: 1,
            user_name: 1,
            unique_id: 1,
            chips: 1,
            winningChips: 1,
            sckId: 1,
            flags: 1
        }

        const userInfo = await GameUser.findOne(wh, projection);
        logger.info("addWallet userInfo : ", userInfo);
        if (userInfo == null) {
            return false;
        }
        logger.info("addWallet userInfo :: ", userInfo);

        userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
        userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

        let opGameWinning = userInfo.winningChips;
        let opChips = userInfo.chips;


        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = added_chips;

        setInfo['$inc']['chips'] = Number(Number(added_chips).toFixed(2));

        userInfo.chips = Number(userInfo.chips) + Number(added_chips);
        userInfo.chips = Number(userInfo.chips.toFixed(2))


        logger.info("\addWallet setInfo :: ", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("addWallet userInfo :: ", userInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\addWallet wh :: ", wh, setInfo);
        let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\addWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
        let totalRemaningAmount = upReps.chips + upReps.winningChips;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                id: userInfo.id,
                uniqueId: userInfo.unique_id,
                userId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                oppWinningChips: opGameWinning,
                chips: upReps.chips,
                winningChips: upReps.winningChips,
                totalBucket: totalRemaningAmount,
                depositId: (tbInfo && tbInfo.depositId) ? tbInfo.depositId : "",
                withdrawId: (tbInfo && tbInfo.withdrawId) ? tbInfo.withdrawId : "",
                gameId: (tbInfo && tbInfo.game_id) ? tbInfo.game_id : "",
                isRobot: (typeof userInfo.flags != "undefined" && userInfo.flags.isRobot) ? userInfo.flags.isRobot : 0,
                gameType: (game) ? game : "", //Game Type
                maxSeat: (tbInfo && tbInfo.maxSeat) ? tbInfo.maxSeat : 0,//Maxumum Player.
                betValue: (tbInfo && tbInfo.betValue) ? tbInfo.betValue : 0,
                tableId: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
            }
            await this.trackUserWallet(walletTrack);
        }

       
        commandAcions.sendDirectEvent(client, CONST.WALLET_UPDATE, {
            winningChips: upReps.winningChips,
            chips: upReps.chips,
            totalWallet: totalRemaningAmount,
            msg: t,
            seatIndex: seatIndex,
            deduct:0
        });

        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}


module.exports.addWallet = async (id, added_chips, tType, t, tbInfo, client, seatIndex,game) => {
    try { 
        logger.info('addWallet : call.-->>>', id, added_chips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return false;
        }
        added_chips = Number(added_chips.toFixed(2));
        let projection = {
            id: 1,
            user_name: 1,
            unique_id: 1,
            chips: 1,
            winningChips: 1,
            sckId: 1,
            flags: 1
        }

        const userInfo = await GameUser.findOne(wh, projection);
        logger.info("addWallet userInfo : ", userInfo);
        if (userInfo == null) {
            return false;
        }
        logger.info("addWallet userInfo :: ", userInfo);

        userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
        userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

        let opGameWinning = userInfo.winningChips;
        let opChips = userInfo.chips;


        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = added_chips;

        setInfo['$inc']['chips'] = Number(Number(added_chips).toFixed(2));

        userInfo.chips = Number(userInfo.chips) + Number(added_chips);
        userInfo.chips = Number(userInfo.chips.toFixed(2))


        logger.info("\addWallet setInfo :: ", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("addWallet userInfo :: ", userInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\addWallet wh :: ", wh, setInfo);
        let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\addWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        let totalRemaningAmount = upReps.chips 

        if (typeof tType != 'undefined') {

            let walletTrack = {
                id: userInfo.id,
                uniqueId: userInfo.unique_id,
                userId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                oppWinningChips: opGameWinning,
                chips: upReps.chips,
                winningChips: upReps.winningChips,
                totalBucket: totalRemaningAmount,
                depositId: (tbInfo && tbInfo.depositId) ? tbInfo.depositId : "",
                withdrawId: (tbInfo && tbInfo.withdrawId) ? tbInfo.withdrawId : "",
                gameId: (tbInfo && tbInfo.game_id) ? tbInfo.game_id : "",
                isRobot: (typeof userInfo.flags != "undefined" && userInfo.flags.isRobot) ? userInfo.flags.isRobot : 0,
                gameType: (game) ? game : "", //Game Type
                maxSeat: (tbInfo && tbInfo.maxSeat) ? tbInfo.maxSeat : 0,//Maxumum Player.
                betValue: (tbInfo && tbInfo.betValue) ? tbInfo.betValue : 0,
                tableId: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
            }
            await this.trackUserWallet(walletTrack);
        }

        if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

            let updateData = {
                $set: {}
            }
            updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

            updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

            if (Object.keys(updateData.$set).length > 0) {
                let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
                logger.info("\addWallet upRepss  :: ", upRepss);
            }
        }
        commandAcions.sendDirectEvent(client, CONST.WALLET_UPDATE, {
            winningChips: upReps.winningChips,
            chips: upReps.chips,
            totalWallet: totalRemaningAmount,
            msg: t,
            seatIndex: seatIndex,
            deduct:0
        });

        // if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined") {
        //     if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
        //         for (let i = 0; i < tbInfo.pi.length; i++) {
        //             if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

        //                 let uChips = Number(upReps.chips) + Number(upReps.winningChips)

        //                 let tbWh = {
        //                     _id: MongoID(tbInfo._id.toString()),
        //                     "playerInfo._id": MongoID(wh._id.toString())
        //                 }
        //                 await SpinnerTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

        //                 commandAcions.sendEventInTable(client, CONST.TABLE_USER_WALLET_UPDATE, {
        //                     totalWallet: uChips,
        //                     seatIndex: tbInfo.playerInfo[i].seatIndex
        //                 });
        //                 break;
        //             }
        //         }
        //     }
        // }
        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}

// module.exports.addWallet = async (id, added_chips, tType, t, tbInfo, client, seatIndex,game) => {
//     try { 
//         logger.info('addWallet : call.-->>>', id, added_chips, t);
//         const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
//         if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
//             return false;
//         }
//         added_chips = Number(added_chips.toFixed(2));
//         let projection = {
//             id: 1,
//             user_name: 1,
//             unique_id: 1,
//             chips: 1,
//             winningChips: 1,
//             sckId: 1,
//             flags: 1
//         }

//         const userInfo = await GameUser.findOne(wh, projection);
//         logger.info("addWallet userInfo : ", userInfo);
//         if (userInfo == null) {
//             return false;
//         }
//         logger.info("addWallet userInfo :: ", userInfo);

//         userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
//         userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

//         let opGameWinning = userInfo.winningChips;
//         let opChips = userInfo.chips;


//         let setInfo = {
//             $inc: {}
//         };
//         let totalDeductChips = added_chips;

//         setInfo['$inc']['winningChips'] = Number(Number(added_chips).toFixed(2));

//         userInfo.winningChips = Number(userInfo.winningChips) + Number(added_chips);
//         userInfo.winningChips = Number(userInfo.winningChips.toFixed(2))


//         logger.info("\addWallet setInfo :: ", setInfo);
//         let tranferAmount = totalDeductChips;
//         logger.info("addWallet userInfo :: ", userInfo);

//         if (Object.keys(setInfo["$inc"]).length > 0) {
//             for (let key in setInfo["$inc"]) {
//                 setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
//             }
//         }
//         if (Object.keys(setInfo["$inc"]).length == 0) {
//             delete setInfo["$inc"];
//         }

//         logger.info("\addWallet wh :: ", wh, setInfo);
//         let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
//         logger.info("\addWallet upReps :: ", upReps);

//         upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
//         upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
//         let totalRemaningAmount = upReps.chips + upReps.winningChips;

//         if (typeof tType != 'undefined') {

//             let walletTrack = {
//                 id: userInfo.id,
//                 uniqueId: userInfo.unique_id,
//                 userId: wh._id.toString(),
//                 trnxType: tType,
//                 trnxTypeTxt: t,
//                 trnxAmount: tranferAmount,
//                 oppChips: opChips,
//                 oppWinningChips: opGameWinning,
//                 chips: upReps.chips,
//                 winningChips: upReps.winningChips,
//                 totalBucket: totalRemaningAmount,
//                 depositId: (tbInfo && tbInfo.depositId) ? tbInfo.depositId : "",
//                 withdrawId: (tbInfo && tbInfo.withdrawId) ? tbInfo.withdrawId : "",
//                 gameId: (tbInfo && tbInfo.game_id) ? tbInfo.game_id : "",
//                 isRobot: (typeof userInfo.flags != "undefined" && userInfo.flags.isRobot) ? userInfo.flags.isRobot : 0,
//                 gameType: (game) ? game : "", //Game Type
//                 maxSeat: (tbInfo && tbInfo.maxSeat) ? tbInfo.maxSeat : 0,//Maxumum Player.
//                 betValue: (tbInfo && tbInfo.betValue) ? tbInfo.betValue : 0,
//                 tableId: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
//             }
//             await this.trackUserWallet(walletTrack);
//         }

//         if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

//             let updateData = {
//                 $set: {}
//             }
//             updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

//             updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

//             if (Object.keys(updateData.$set).length > 0) {
//                 let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
//                 logger.info("\addWallet upRepss  :: ", upRepss);
//             }
//         }
//         commandAcions.sendDirectEvent(client, CONST.WALLET_UPDATE, {
//             winningChips: upReps.winningChips,
//             chips: upReps.chips,
//             totalWallet: totalRemaningAmount,
//             msg: t,
//             seatIndex: seatIndex
//         });

//         // if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined") {
//         //     if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
//         //         for (let i = 0; i < tbInfo.pi.length; i++) {
//         //             if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

//         //                 let uChips = Number(upReps.chips) + Number(upReps.winningChips)

//         //                 let tbWh = {
//         //                     _id: MongoID(tbInfo._id.toString()),
//         //                     "playerInfo._id": MongoID(wh._id.toString())
//         //                 }
//         //                 await SpinnerTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

//         //                 commandAcions.sendEventInTable(client, CONST.TABLE_USER_WALLET_UPDATE, {
//         //                     totalWallet: uChips,
//         //                     seatIndex: tbInfo.playerInfo[i].seatIndex
//         //                 });
//         //                 break;
//         //             }
//         //         }
//         //     }
//         // }
//         return totalRemaningAmount;
//     } catch (e) {
//         logger.info("deductWallet : 1 : Exception : 1", e)
//         return 0
//     }
// }


// module.exports.deductWalletPayOut = async (id, added_chips, tType, t, tbInfo, client, seatIndex,game) => {
//     try { 
//         logger.info('addWallet : call.-->>>', id, added_chips, t);
//         const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
//         if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
//             return false;
//         }
//         added_chips = Number(added_chips.toFixed(2));
//         let projection = {
//             id: 1,
//             user_name: 1,
//             unique_id: 1,
//             chips: 1,
//             winningChips: 1,
//             sckId: 1,
//             flags: 1
//         }

//         const userInfo = await GameUser.findOne(wh, projection);
//         logger.info("addWallet userInfo : ", userInfo);
//         if (userInfo == null) {
//             return false;
//         }
//         logger.info("addWallet userInfo :: ", userInfo);

//         userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
//         //userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

//         //let opGameWinning = userInfo.winningChips;
//         let opChips = userInfo.chips;


//         let setInfo = {
//             $inc: {}
//         };
//         let totalDeductChips = added_chips;

//         setInfo['$inc']['chips'] = Number(Number(added_chips).toFixed(2));

//         userInfo.chips = Number(userInfo.chips) + Number(added_chips);
//         userInfo.chips = Number(userInfo.chips.toFixed(2))


//         logger.info("\addWallet setInfo :: ", setInfo);
//         let tranferAmount = totalDeductChips;
//         logger.info("addWallet userInfo :: ", userInfo);

//         if (Object.keys(setInfo["$inc"]).length > 0) {
//             for (let key in setInfo["$inc"]) {
//                 setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
//             }
//         }
//         if (Object.keys(setInfo["$inc"]).length == 0) {
//             delete setInfo["$inc"];
//         }

//         logger.info("\addWallet wh :: ", wh, setInfo);
//         let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
//         logger.info("\addWallet upReps :: ", upReps);

//         upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
//         //upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
//         let totalRemaningAmount = upReps.chips

//         if (typeof tType != 'undefined') {

//             let walletTrack = {
//                 id: userInfo.id,
//                 uniqueId: userInfo.unique_id,
//                 userId: wh._id.toString(),
//                 trnxType: tType,
//                 trnxTypeTxt: t,
//                 trnxAmount: tranferAmount,
//                 oppChips: opChips,
//                 oppWinningChips: opGameWinning,
//                 chips: upReps.chips,
//                 winningChips: upReps.winningChips,
//                 totalBucket: totalRemaningAmount,
//                 depositId: (tbInfo && tbInfo.depositId) ? tbInfo.depositId : "",
//                 withdrawId: (tbInfo && tbInfo.withdrawId) ? tbInfo.withdrawId : "",
//                 gameId: (tbInfo && tbInfo.game_id) ? tbInfo.game_id : "",
//                 isRobot: (typeof userInfo.flags != "undefined" && userInfo.flags.isRobot) ? userInfo.flags.isRobot : 0,
//                 gameType: (game) ? game : "", //Game Type
//                 maxSeat: (tbInfo && tbInfo.maxSeat) ? tbInfo.maxSeat : 0,//Maxumum Player.
//                 betValue: (tbInfo && tbInfo.betValue) ? tbInfo.betValue : 0,
//                 tableId: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
//             }
//             await this.trackUserWallet(walletTrack);
//         }

//         if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

//             let updateData = {
//                 $set: {}
//             }
//             updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

//             updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

//             if (Object.keys(updateData.$set).length > 0) {
//                 let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
//                 logger.info("\addWallet upRepss  :: ", upRepss);
//             }
//         }
//         commandAcions.sendDirectEvent(client, CONST.WALLET_UPDATE, {
//             winningChips: upReps.winningChips,
//             chips: upReps.chips,
//             totalWallet: totalRemaningAmount,
//             msg: t,
//             seatIndex: seatIndex,
//             deduct:1
//         });

//         // if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined") {
//         //     if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
//         //         for (let i = 0; i < tbInfo.pi.length; i++) {
//         //             if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

//         //                 let uChips = Number(upReps.chips) + Number(upReps.winningChips)

//         //                 let tbWh = {
//         //                     _id: MongoID(tbInfo._id.toString()),
//         //                     "playerInfo._id": MongoID(wh._id.toString())
//         //                 }
//         //                 await SpinnerTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

//         //                 commandAcions.sendEventInTable(client, CONST.TABLE_USER_WALLET_UPDATE, {
//         //                     totalWallet: uChips,
//         //                     seatIndex: tbInfo.playerInfo[i].seatIndex
//         //                 });
//         //                 break;
//         //             }
//         //         }
//         //     }
//         // }
//         return totalRemaningAmount;
//     } catch (e) {
//         logger.info("deductWallet : 1 : Exception : 1", e)
//         return 0
//     }
// }

module.exports.BonusWallet = async (id, bonusChips, tType, t, tbInfo, client, seatIndex,game) => {
    try {
        logger.info('\ndedudctWallet : call.-->>>', id, bonusChips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };

        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return 0;
        }

        bonusChips = Number(bonusChips.toFixed(2));
        let projection = {
            id: 1,
            username: 1,
            uniqueId: 1,
            bonus: 1,
            winningChips: 1,
            sckId: 1,
            flags: 1
        }

        const userInfo = await GameUser.findOne(wh, projection);
        logger.info("dedudctWallet userInfo : ", userInfo);

        if (userInfo == null) {
            return false;
        }
        logger.info("dedudctWallet userInfo :: ", userInfo);

        userInfo.bonus = (typeof userInfo.bonus == 'undefined' || isNaN(userInfo.bonus)) ? 0 : Number(userInfo.bonus);
   
        let opbonus = userInfo.bonus;


        logger.info("userInfo.chips =>", userInfo.chips)
        //logger.info("userInfo.winningChips =>", userInfo.winningChips)

        let setInfo = {
            $inc: {}
        };
        let totalbonusChips = bonusChips;

        if (userInfo.bonus > 0 && bonusChips < 0) {

            setInfo['$inc']['chips'] = (userInfo.chips + bonusChips) >= 0 ? Number(bonusChips) : Number(-userInfo.chips);
            setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2))

            let chips = userInfo.chips;

            userInfo.chips = (userInfo.chips + bonusChips) >= 0 ? (Number(userInfo.chips) + Number(bonusChips)) : 0;
            userInfo.chips = Number(Number(userInfo.chips).toFixed(2));

            bonusChips = (bonusChips + userInfo.chips) >= 0 ? 0 : (Number(bonusChips) + Number(chips));
            bonusChips = Number(Number(bonusChips).toFixed(2));
        }

        logger.info("\ndedudctWallet setInfo :: --->", setInfo);
        let tranferAmount = totalbonusChips;
        logger.info("dedudctWallet userInfo :: ==>", userInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\ndedudctWallet wh :: ", wh, setInfo);
        let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\ndedudctWallet upReps :: ", upReps);

        upReps.bonus = (typeof upReps.bonus == 'undefined' || isNaN(upReps.bonus)) ? 0 : Number(upReps.bonus);
        //upReps.winningbonus = (typeof upReps.winningbonus == 'undefined' || isNaN(upReps.winningbonus)) ? 0 : Number(upReps.winningbonus);
        let totalRemaningAmount = upReps.bonus //+ upReps.winningbonus;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                id: userInfo.id,
                uniqueId: userInfo.unique_id,
                userId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: upReps.chips,
                oppWinningChips: upReps.winningChips,
                oppbonus:opbonus,
                chips: upReps.chips,
                winningChips: upReps.winningChips,
                bonus: upReps.bonus,
                totalBucket: totalRemaningAmount,
                depositId: (tbInfo && tbInfo.depositId) ? tbInfo.depositId : "",
                withdrawId: (tbInfo && tbInfo.withdrawId) ? tbInfo.withdrawId : "",
                gameId: (tbInfo && tbInfo.gameId) ? tbInfo.game_id : "",
                isRobot: (typeof userInfo.flags != "undefined" && userInfo.flags.isRobot) ? userInfo.flags.isRobot : 0,
                gameType: (game) ? game : "", //Game Type
                maxSeat: (tbInfo && tbInfo.maxSeat) ? tbInfo.maxSeat : 0,//Maxumum Player.
                betValue: (tbInfo && tbInfo.betValue) ? tbInfo.betValue : 0,
                tableId: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
            }
            await this.trackUserWallet(walletTrack);
        }

        if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) 

        //|| (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)

        ) {

            let updateData = {
                $set: {}
            }
            updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

            //updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

            if (Object.keys(updateData.$set).length > 0) {
                let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
                logger.info("\ndedudctWallet upRepss  :: ", upRepss);
            }
        }

        logger.info(" userInfo.sckId.toString() => ", userInfo.sckId)
        logger.info(" upReps userInfo.sckId => ", upReps.sckId)
        logger.info(" client userInfo.sckId => ", client)

        // commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.WALLET_UPDATE, {
        //     winningChips: upReps.winningChips,
        //     chips: upReps.chips,
        //     totalWallet: totalRemaningAmount,
        //     msg: t,
        //     seatIndex: seatIndex
        // });

        commandAcions.sendDirectEvent(client, CONST.WALLET_UPDATE, {
            winningChips: upReps.winningChips,
            chips: upReps.chips,
            totalWallet: totalRemaningAmount,
            msg: t,
            seatIndex: seatIndex
        });


        // if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined" && typeof tbInfo.gt != "undefined" && tbInfo.gt == "Points Rummy") {
        //     if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
        //         for (let i = 0; i < tbInfo.pi.length; i++) {
        //             if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

        //                 let uChips = Number(upReps.chips) //+ Number(upReps.winningChips)

        //                 let tbWh = {
        //                     _id: MongoID(tbInfo._id.toString()),
        //                     "playerInfo._id": MongoID(wh._id.toString())
        //                 }

        //                 await SpinnerTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

        //                 commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.TABLE_USER_WALLET_UPDATE, {
        //                     totalWallet: uChips,
        //                     seatIndex: tbInfo.playerInfo[i].seatIndex
        //                 });
        //                 break;
        //             }
        //         }
        //     }
        // }
        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}

module.exports.trackUserWallet = async (obj) => {
    logger.info("\ntrackUserWallet obj ::", obj);

    await UserWalletTracks.create(obj)
    return true;
}