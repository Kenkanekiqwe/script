'use strict';

global._torgMarketLock = global._torgMarketLock || false;

function acquireTorgLock(player) {
    if (global._torgMarketLock) {
        if (player && mp.players.exists(player)) {
            isNotify(player, 2, 'top-mid', 'Торговая площадка занята, подождите.', 2000);
        }
        return false;
    }
    global._torgMarketLock = true;
    return true;
}

function releaseTorgLock() {
    global._torgMarketLock = false;
}

function loadTorgData(cb) {
    global.DB.query('SELECT torg FROM systems LIMIT 1', [], (err, results) => {
        if (err) return cb(err);
        let torgData = [];
        try {
            torgData = results && results.length > 0 ? JSON.parse(results[0].torg) : [];
            if (!Array.isArray(torgData)) torgData = [];
        } catch (_e) {
            torgData = [];
        }
        cb(null, torgData);
    });
}

function saveTorgData(torgData, cb) {
    global.DB.query('UPDATE systems SET torg = ? LIMIT 1', [JSON.stringify(torgData)], (err) => {
        if (cb) cb(err);
    });
}

function normalizeTorgItemName(raw) {
    return String(raw == null ? '' : raw).trim();
}

function parseTorgPrice(raw) {
    const p = parseInt(String(raw == null ? 0 : raw).replace(/\D/g, ''), 10);
    return Number.isFinite(p) && p > 0 ? p : 0;
}

global.torgupd = async function () {
    try {
        mp.players.forEach((player) => {
            if (!player || !mp.players.exists(player) || !player.getVariable('auth')) return;
            player.setVariable('updtorg', true);
        });

        const systemsResult = await global.querydb('SELECT * FROM systems LIMIT 1');
        if (!systemsResult || systemsResult.length === 0) {
            mp.players.forEach((player) => {
                if (!player || !mp.players.exists(player) || !player.getVariable('auth')) return;
                player.setVariable('updtorg', false);
            });
            return;
        }

        JSON.parse(systemsResult[0].torg);

        mp.players.forEach((player) => {
            if (!player || !mp.players.exists(player) || !player.getVariable('auth')) return;
            player.setVariable('updtorg', false);
        });
    } catch (error) {
        console.log(error);
        mp.players.forEach((p) => {
            if (p && mp.players.exists(p) && p.getVariable('auth')) p.setVariable('updtorg', false);
        });
    }
};

global.torgupdplayer = async function (player) {
    try {
        if (!player || !mp.players.exists(player) || !player.getVariable('auth')) return;
    } catch (error) {
        console.log(error);
    }
};

mp.events.add('buyPhone:SERVER', (player, index, name) => {
    try {
        if (!player || !mp.players.exists(player) || !player.getVariable('auth')) return;

        if (new Date().getTime() - player.clicked < 1000) return isNotify(player, 2, 'top-mid', 'Не так часто.', 1500);
        player.clicked = new Date().getTime();

        if (player.getVariable('updtorg') === true) return isNotify(player, 2, 'top-mid', 'Торговая площадка обновляется, попробуйте позже.', 3000);
        if (!acquireTorgLock(player)) return;
        if (typeof global.economyTryLock === 'function' && !global.economyTryLock(player, 'torg', 8000)) {
            releaseTorgLock();
            return isNotify(player, 2, 'top-mid', 'Подождите, операция уже выполняется.', 2500);
        }

        loadTorgData((err, torgData) => {
            if (err) {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                return console.log(err);
            }

            const itemIndex = torgData.findIndex((item) => item.indexbd === index);
            if (itemIndex === -1) {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                return isNotify(player, 2, 'top-mid', 'Товар уже продан или снят с продажи.', 3000);
            }

            const item = torgData[itemIndex];
            const price = parseTorgPrice(item.price);
            const itemName = normalizeTorgItemName(item.name);
            if (!itemName || price < 100000) {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                return isNotify(player, 2, 'top-mid', 'Некорректное объявление.', 3000);
            }
            if (Number(item.sellerstatic) === Number(player.static)) {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                return isNotify(player, 2, 'top-mid', 'Вы не можете купить свой товар.', 3000);
            }

            const finishBuy = (notifyText) => {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                if (notifyText) isNotify(player, 3, 'top-mid', notifyText, 3000);
                global.torgupd();
            };

            const rollbackListing = () => {
                loadTorgData((e2, fresh) => {
                    if (e2 || !Array.isArray(fresh)) return;
                    if (fresh.some((x) => x.indexbd === index)) return;
                    fresh.push({ indexbd: index, name: itemName, price, sellerstatic: item.sellerstatic });
                    saveTorgData(fresh, () => {});
                });
            };

            const grantItemToBuyer = () => {
                if (!Array.isArray(player.inventory)) player.inventory = [];
                if (!Array.isArray(player.fastSlots)) player.fastSlots = ['', '', ''];
                player.inventory.push(itemName);
                global.saveInventory(player);
                player.call('updateInventory', [JSON.stringify(player.inventory), JSON.stringify(player.fastSlots)]);
            };

            const creditSeller = (sellerLogin) => {
                const sellerStatic = item.sellerstatic;
                const targetPlayer = mp.players.toArray().find((p) => Number(p.static) === Number(sellerStatic));
                const onCredited = () => {
                    global.sendDiscordLog(
                        `Покупка на торговой площадке!\n\nИгрок - [#${player.static}] ${player.login}\nПродавец - [#${sellerStatic}] ${sellerLogin || sellerStatic}\nПредмет - ${global.formweap(itemName)}\nСумма - ${global.formatnum1(price)}$`,
                        '1347374978445611068'
                    );
                    if (targetPlayer && mp.players.exists(targetPlayer)) {
                        isNotify(targetPlayer, 3, 'top-mid', `${player.login} купил у вас ${global.formweap(itemName)} за ${global.formatnum1(price)}$`, 3000);
                        targetPlayer.call('sound:client', [3]);
                        targetPlayer.outputChatBox(`!{red}${player.login} !{DodgerBlue}купил у вас !{green}${global.formweap(itemName)} !{DodgerBlue}за !{yellow}${global.formatnum1(price)}$`);
                    }
                    finishBuy(`Вы купили ${global.formweap(itemName)} за ${global.formatnum1(price)}$`);
                };

                if (typeof global.economyAddMoney === 'function') {
                    global.economyAddMoney(sellerStatic, price, (eAdd) => {
                        if (eAdd) {
                            if (typeof global.economyAddMoney === 'function') global.economyAddMoney(player, price, () => {});
                            rollbackListing();
                            return finishBuy(null);
                        }
                        onCredited();
                    });
                    return;
                }

                global.DB.query('SELECT login, money FROM accounts WHERE static = ? LIMIT 1', [sellerStatic], (eSel, rows) => {
                    if (eSel || !rows || !rows.length) {
                        if (typeof global.economyAddMoney === 'function') global.economyAddMoney(player, price, () => {});
                        rollbackListing();
                        return finishBuy(null);
                    }
                    const sellerLoginDb = rows[0].login;
                    const sellerNewMoney = (parseInt(rows[0].money, 10) || 0) + price;
                    global.DB.query('UPDATE accounts SET money = ? WHERE static = ?', [sellerNewMoney, sellerStatic], (eUpd) => {
                        if (eUpd) {
                            if (typeof global.economyAddMoney === 'function') global.economyAddMoney(player, price, () => {});
                            rollbackListing();
                            return finishBuy(null);
                        }
                        if (targetPlayer && mp.players.exists(targetPlayer)) {
                            targetPlayer.money = sellerNewMoney;
                            targetPlayer.call('updateMoney', [global.formatnum1(sellerNewMoney)]);
                        }
                        onCredited();
                    });
                });
            };

            const afterListingRemoved = () => {
                grantItemToBuyer();
                global.DB.query('SELECT login FROM accounts WHERE static = ? LIMIT 1', [item.sellerstatic], (eLogin, accRows) => {
                    const sellerLogin = accRows && accRows[0] ? accRows[0].login : null;
                    creditSeller(sellerLogin);
                });
            };

            const spendAndRemove = () => {
                if (typeof global.economySpendMoney !== 'function') {
                    releaseTorgLock();
                    if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                    return isNotify(player, 2, 'top-mid', 'Покупка временно недоступна.', 3000);
                }
                global.economySpendMoney(player, price, (eSpend, okSpend) => {
                    if (eSpend || !okSpend) {
                        releaseTorgLock();
                        if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                        return isNotify(player, 2, 'top-mid', 'Недостаточно денег для покупки.', 3000);
                    }

                    torgData.splice(itemIndex, 1);
                    saveTorgData(torgData, (eSave) => {
                        if (eSave) {
                            global.economyAddMoney(player, price, () => {});
                            releaseTorgLock();
                            if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                            return isNotify(player, 2, 'top-mid', 'Ошибка покупки. Средства возвращены.', 3500);
                        }
                        afterListingRemoved();
                    });
                });
            };

            spendAndRemove();
        });
    } catch (error) {
        releaseTorgLock();
        if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
        console.log(error);
    }
});

mp.events.add('salePhone:SERVER', (player, index, price, invindex, name) => {
    try {
        if (!player || !mp.players.exists(player) || !player.getVariable('auth')) return;
        if (player.getVariable('updtorg') === true) return isNotify(player, 2, 'top-mid', 'Торговая площадка обновляется, попробуйте позже.', 3000);

        const salePrice = parseTorgPrice(price);
        if (salePrice < 100000) return isNotify(player, 2, 'top-mid', 'Минимальная сумма 100.000$', 3000);
        if (salePrice > 100000000) return isNotify(player, 2, 'top-mid', 'Максимальная сумма 100.000.000$', 3000);

        if (new Date().getTime() - player.clicked < 1000) return isNotify(player, 2, 'top-mid', 'Не так часто.', 1500);
        player.clicked = new Date().getTime();

        if (!Array.isArray(player.inventory) || invindex < 0 || invindex >= player.inventory.length) {
            return isNotify(player, 2, 'top-mid', 'Неверный слот инвентаря.', 3000);
        }

        const sellItem = normalizeTorgItemName(player.inventory[invindex]);
        if (!sellItem) return isNotify(player, 2, 'top-mid', 'Пустой слот инвентаря.', 3000);
        if (name && normalizeTorgItemName(name) !== sellItem) {
            return isNotify(player, 2, 'top-mid', 'Несоответствие предмета.', 3000);
        }

        if (typeof global.inventoryItemIsBlockedForTransfer === 'function' && global.inventoryItemIsBlockedForTransfer(player, sellItem)) {
            return isNotify(
                player,
                2,
                'top-mid',
                'Снимите предмет с экипировки или из быстрого слота — такие вещи нельзя выставлять на продажу.',
                4500
            );
        }

        if (!acquireTorgLock(player)) return;
        if (typeof global.economyTryLock === 'function' && !global.economyTryLock(player, 'torg', 8000)) {
            releaseTorgLock();
            return isNotify(player, 2, 'top-mid', 'Подождите, операция уже выполняется.', 2500);
        }

        loadTorgData((err, torgData) => {
            if (err) {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                return console.log(err);
            }

            const lastIndexbd = torgData.length > 0 ? torgData[torgData.length - 1].indexbd : 0;
            const newIndexbd = lastIndexbd + 1;
            const listing = {
                indexbd: newIndexbd,
                name: sellItem,
                price: salePrice,
                sellerstatic: player.static
            };
            torgData.push(listing);

            saveTorgData(torgData, (eSave) => {
                if (eSave) {
                    releaseTorgLock();
                    if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                    return isNotify(player, 2, 'top-mid', 'Не удалось выставить на продажу.', 3000);
                }

                const curItem = player.inventory[invindex];
                if (normalizeTorgItemName(curItem) !== sellItem) {
                    loadTorgData((e2, fresh) => {
                        if (!e2 && Array.isArray(fresh)) {
                            const li = fresh.findIndex((x) => x.indexbd === newIndexbd);
                            if (li !== -1) {
                                fresh.splice(li, 1);
                                saveTorgData(fresh, () => global.torgupd());
                            }
                        }
                    });
                    releaseTorgLock();
                    if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                    return isNotify(player, 2, 'top-mid', 'Предмет изменился — продажа отменена.', 3000);
                }

                player.inventory.splice(invindex, 1);
                global.saveInventory(player);
                player.call('updateInventory', [JSON.stringify(player.inventory), JSON.stringify(player.fastSlots)]);

                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                global.torgupd();
                global.sendDiscordLog(
                    `Выставление на торговую площадку!\n\nИгрок - [#${player.static}] ${player.login}\nПредмет - ${global.formweap(sellItem)}\nСумма - ${global.formatnum1(salePrice)}$`,
                    '1347374978445611068'
                );
                isNotify(player, 3, 'top-mid', `Вы выставили ${global.formweap(sellItem)} на продажу за ${global.formatnum1(salePrice)}$`, 3000);
            });
        });
    } catch (error) {
        releaseTorgLock();
        if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
        console.log(error);
    }
});

mp.events.add('cancelPhone:SERVER', (player, index, name) => {
    try {
        if (!player || !mp.players.exists(player) || !player.getVariable('auth')) return;
        if (player.getVariable('updtorg') === true) return isNotify(player, 2, 'top-mid', 'Торговая площадка обновляется, попробуйте позже.', 3000);
        if (new Date().getTime() - player.clicked < 1000) return isNotify(player, 2, 'top-mid', 'Не так часто.', 1500);
        player.clicked = new Date().getTime();

        if (!acquireTorgLock(player)) return;
        if (typeof global.economyTryLock === 'function' && !global.economyTryLock(player, 'torg', 8000)) {
            releaseTorgLock();
            return isNotify(player, 2, 'top-mid', 'Подождите, операция уже выполняется.', 2500);
        }

        loadTorgData((err, torgData) => {
            if (err) {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                return console.log(err);
            }

            const itemIndex = torgData.findIndex((item) => item.indexbd === index);
            if (itemIndex === -1) {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                return isNotify(player, 2, 'top-mid', 'Объявление не найдено.', 3000);
            }

            const item = torgData[itemIndex];
            if (Number(item.sellerstatic) !== Number(player.static)) {
                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                return isNotify(player, 2, 'top-mid', 'Это не ваше объявление.', 3000);
            }

            const itemName = normalizeTorgItemName(item.name);
            torgData.splice(itemIndex, 1);

            saveTorgData(torgData, (eSave) => {
                if (eSave) {
                    releaseTorgLock();
                    if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                    return isNotify(player, 2, 'top-mid', 'Не удалось снять с продажи.', 3000);
                }

                if (!Array.isArray(player.inventory)) player.inventory = [];
                if (!Array.isArray(player.fastSlots)) player.fastSlots = ['', '', ''];
                player.inventory.push(itemName);
                global.saveInventory(player);
                player.call('updateInventory', [JSON.stringify(player.inventory), JSON.stringify(player.fastSlots)]);

                releaseTorgLock();
                if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
                global.torgupd();
                global.sendDiscordLog(
                    `Забирание с торговой площадки!\n\nИгрок - [#${player.static}] ${player.login}\nПредмет - ${global.formweap(itemName)}\nСумма (была) - ${global.formatnum1(item.price)}$`,
                    '1347374978445611068'
                );
                isNotify(player, 3, 'top-mid', `Вы забрали предмет ${global.formweap(itemName)} с маркета.`, 3000);
            });
        });
    } catch (error) {
        releaseTorgLock();
        if (typeof global.economyUnlock === 'function') global.economyUnlock(player, 'torg');
        console.log(error);
    }
});
