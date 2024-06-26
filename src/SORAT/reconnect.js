const mongoose = require('mongoose');
const { omit } = require('lodash');

const CONST = require('../../constant');
const logger = require('../../logger');
const commonHelper = require('../helper/commonHelper');
const { sendDirectEvent, getPlayingUserInRound } = require('../helper/socketFunctions');
const { filterBeforeSendSPEvent } = require('../helper/signups/appStart');

const Users = mongoose.model('users');
const MongoID = mongoose.Types.ObjectId;
const SoratTables = mongoose.model('soratTables');

module.exports.
    reconnect = async (requestData, client) => {
        try {
            if (requestData.playerId !== '' && requestData.playerId !== null && requestData.playerId !== undefined) {
                let gwh = {
                    _id: commonHelper.strToMongoDb(requestData.playerId),
                };

                let userInfo = await Users.findOne(gwh, {}).lean();
                logger.info('reconnect User Info : ', JSON.stringify(userInfo));

                const newData = omit(userInfo, ['lastLoginDate', 'createdAt', 'modifiedAt', 'password', 'flags']);
                //logger.info('newData ->', newData);

                const finaldata = {
                    ...newData,
                };
                logger.info('Reconnect Final Data => ', finaldata);
                //let responseResult = await filterBeforeSendSPEvent(finaldata);

                // if (requestData.tableId == '') {
                //     const response = {
                //         login: true,
                //         ...responseResult,
                //         sceneName: CONST.DASHBOARD,

                //     };

                //     sendDirectEvent(client.id.toString(), CONST.RECONNECT, response);
                //     return false;
                // }

                //console.log("client ",client)
                //when player in table
                const wh = {
                    //_id: MongoID(requestData.tableId),
                    'playerInfo._id': MongoID(requestData.playerId),
                };

                const project = {};
                const tabInfo = await SoratTables.findOne(wh, project).lean();
                
                console.log("tabInfo :::::::::::::::",tabInfo)

                if (tabInfo === null) {
                    const response = {
                        login: true,
                        userInfo: finaldata,
                        sceneName: CONST.DASHBOARD,
                    };

                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, response);
                    return false;
                }

                const response = {
                    pi: tabInfo.playerInfo,
                    spi: requestData.playerId,
                    gameState: tabInfo.gameState,
                    ap: tabInfo.activePlayer,
                    tableid: tabInfo._id,
                    gamePlayType: tabInfo.gamePlayType,
                    sceneName: CONST.GAMEPLAY,
                };

                console.log("tabInfo ::::::::::::::: response ",response)


                if (tabInfo.gameState === "StartSorat") {
                    let currentDateTime = new Date();
                    let turnTime = new Date(tabInfo.gameTimer.GST);

                    let diff = (currentDateTime - turnTime);

                    console.log("diff ",diff)
                    console.log("currentDateTime ",currentDateTime)
                    console.log("turnTime ",turnTime)



                    const responseRS = {
                        ...response,
                        currentTurnUserSeatIndex: tabInfo.turnSeatIndex,
                        currentTurnTimer: (22 - (diff/1000)),
                    };
                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, responseRS);
                } else if (tabInfo.gameState === CONST.SORAT_ROUND_START_TIMER) {
                    let currentDateTime = new Date();
                    let turnTime = new Date(tabInfo.gameTimer.GST);

                    let diff = (currentDateTime - turnTime);

                    console.log("diff ",diff)
                    console.log("currentDateTime ",currentDateTime)
                    console.log("turnTime ",turnTime)

                    const responseRST = {
                        ...response,
                        timer: (322-(diff/1000)),
                    };

                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, responseRST);
                } else if (tabInfo.gameState === "WinnerDecalre") {
                    // const scoreBoard = tabInfo.playersScoreBoard;
                    // let winnerViewResponse = winnerViewResponseFilter(scoreBoard);

                    // const responseRSB = {
                    //     playersScoreBoard: winnerViewResponse.userInfo,
                    //     totalLostChips: tabInfo.tableAmount,
                    //     winPlayerId: tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex]._id,
                    //     gamePlayType: tabInfo.gamePlayType,
                    // };

                    const responseRE = {
                        ...response,
                        // GSB: responseRSB,
                    };

                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, responseRE);
                } else if (tabInfo.gameState === CONST.CARD_DEALING) {
                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, response);
                } else {
                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, response);
                }
                return;
            } else {
                const response = {
                    login: false,
                    sceneName: CONST.DASHBOARD,
                };
                sendDirectEvent(client.id, CONST.RECONNECT, response, {
                    flag: false,
                    msg: 'Player Id not found!',
                });
                return false;
            }
        } catch (e) {
            logger.error('Reconnect.js Exception Reconnect  => ', e);
        }
    };
