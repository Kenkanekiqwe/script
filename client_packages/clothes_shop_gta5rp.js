'use strict';

/**
 * Shared client adapter for the original GTA5RP menu_shop_clothes CEF.
 * Regular, premium and Spectrum shops all use one browser and one camera.
 */

if (!global.rpc) global.rpc = require('./rage-rpc.min.js');
const rpc = global.rpc;

const SHOP_CEF = 'menu_shop_clothes/index.html';
const VALID_MODES = new Set(['regular', 'donate', 'spectrum']);
const BODY_PART_TO_CLOTH = Object.freeze({
    '0': 1,
    '1': 2,
    '11': 3,
    '4': 4,
    '6': 5,
    '7': 6,
    '-1': 7,
    '5': 8,
    '-88': 5,
    '-2': 12,
    '-6': 13,
    '-7': 14,
    '3': 15
});
const SPECTRUM_PREVIEW = {
    x: -195.3695831298828,
    y: -24.71133804321289,
    z: 50.698699951171875,
    h: 159.54833984375
};

let shopBrowser = null;
let shopMode = null;
let shopList = [];
let selectedIndex = -1;
let selectedColor = 0;
let openingTimer = null;

global.__clothesShopCamState =
    global.__clothesShopCamState ||
    (typeof global.createClothesShopCameraState === 'function'
        ? global.createClothesShopCameraState()
        : null);
const cameraState = global.__clothesShopCamState;

const CLOTHES_SHOP_PAUSE_SUPPRESS_FRAMES = 24;
let clothesShopPauseSuppressFrames = 0;

function blockClothesShopPauseControls() {
    for (let g = 0; g <= 2; g++) {
        mp.game.controls.disableControlAction(g, 156, true);
        mp.game.controls.disableControlAction(g, 199, true);
        mp.game.controls.disableControlAction(g, 200, true);
    }
}

function suppressPauseAfterClothesShopClose() {
    clothesShopPauseSuppressFrames = CLOTHES_SHOP_PAUSE_SUPPRESS_FRAMES;
    if (typeof global.suppressPauseMenuAfterEsc === 'function') {
        global.suppressPauseMenuAfterEsc(CLOTHES_SHOP_PAUSE_SUPPRESS_FRAMES);
    }
}

mp.events.add('render', () => {
    if (clothesShopPauseSuppressFrames > 0) {
        clothesShopPauseSuppressFrames--;
        blockClothesShopPauseControls();
    }
    if (global.__clothesShopOpen === true) {
        blockClothesShopPauseControls();
    }
});

function ensureBrowser() {
    shopBrowser = global.ensureShopBrowser(shopBrowser, SHOP_CEF);
    return shopBrowser;
}

global.getFlowClothesShopBrowser = function getFlowClothesShopBrowser() {
    return shopBrowser;
};

if (typeof global.registerActiveBrowserOverlay === 'function') {
    global.registerActiveBrowserOverlay(() => shopBrowser);
}

function clearOpeningState() {
    global.__clothesShopOpening = false;
    if (openingTimer) clearTimeout(openingTimer);
    openingTimer = null;
}

global.requestFlowClothesShopEntry = function requestFlowClothesShopEntry(expectedMode) {
    const mode = String(expectedMode || '');
    if (!VALID_MODES.has(mode)) return false;
    if (global.__clothesShopOpen === true || global.__clothesShopOpening === true) return false;

    if (typeof global.tryCloseInventoryEsc === 'function') global.tryCloseInventoryEsc();
    global.__clothesShopOpening = true;
    mp.events.callRemote('teleportToLocation', 'teleportCoords', mode);
    openingTimer = setTimeout(() => {
        if (global.__clothesShopOpen !== true) global.__clothesShopOpening = false;
        openingTimer = null;
    }, 5000);
    return true;
};

function findEntry(index) {
    const wanted = Number(index);
    for (let i = 0; i < shopList.length; i++) {
        if (Number(shopList[i] && shopList[i].i) === wanted) return shopList[i];
    }
    return null;
}

function applySelectedPreview() {
    if (global.__clothesShopOpen !== true) return;
    const entry = findEntry(selectedIndex);
    if (!entry || !Array.isArray(entry.clothes)) return;

    const bodyPart = Number(entry.clothes[0]);
    const clothId = Number(entry.clothId) || BODY_PART_TO_CLOTH[String(bodyPart)] || 3;
    const textures = Array.isArray(entry.clothes[2]) ? entry.clothes[2] : [0];
    const color = Math.max(0, Math.min(textures.length - 1, Number(selectedColor) || 0));
    const drawable = Number(entry.clothes[1]) || 0;
    const texture = Number(textures[color]) || 0;

    if (cameraState && typeof global.setClothesShopCameraCategory === 'function') {
        global.setClothesShopCameraCategory(cameraState, clothId);
    }
    if (entry.previewDisabled === true) return;
    if (typeof global.applyClothesShopPreviewLocal === 'function') {
        global.applyClothesShopPreviewLocal({
            ClothID: clothId,
            Drawable: drawable,
            TopTexture: texture,
            Torso: entry.torso == null ? null : Number(entry.torso)
        });
    }
}

function openCamera(mode) {
    if (!cameraState) return;
    if (mode === 'spectrum') {
        setTimeout(() => {
            if (global.__clothesShopOpen !== true || shopMode !== 'spectrum') return;
            const position = new mp.Vector3(
                SPECTRUM_PREVIEW.x,
                SPECTRUM_PREVIEW.y,
                SPECTRUM_PREVIEW.z
            );
            global.setClothesShopCameraWorld(cameraState, position, SPECTRUM_PREVIEW.h, 'world');
            global.bindClothesShopCameraControls(cameraState);
        }, 150);
        return;
    }
    global.openClothesShopPreviewCamera(
        cameraState,
        global.CLOTHES_SHOP_STRAWBERRY_PREVIEW,
        150
    );
}

function showBrowser(payload) {
    const browser = ensureBrowser();
    if (!browser || !mp.browsers.exists(browser)) return false;

    const buttonText = payload.mode === 'spectrum' ? 'Оплатить DP' : 'Оплатить наличными';
    const payloadCode = JSON.stringify(payload);
    const labelCode = JSON.stringify(buttonText);
    const code =
        'window.donateShopClothesOpen(' +
        payloadCode +
        ');' +
        '(function(){function f(){try{var b=document.querySelector("#shop_clothes button.yk-btn.green");' +
        'if(b)b.textContent=' +
        labelCode +
        ';}catch(_e){}}f();setTimeout(f,50);setTimeout(f,200);}());';

    return global.openManagedCefWhen(
        browser,
        'typeof window.donateShopClothesOpen==="function"&&typeof shopClothesMenu!=="undefined"',
        [code]
    );
}

function hideWorldUi() {
    if (typeof global.hideWorldUiForModal === 'function') {
        global.hideWorldUiForModal('clothesShop');
        return;
    }
    mp.events.call('c:minimap', false);
    mp.gui.chat.show(false);
    mp.events.call('hud', false);
}

function showWorldUi() {
    if (typeof global.showWorldUiAfterModal === 'function') {
        global.showWorldUiAfterModal('clothesShop');
        return;
    }
    mp.events.call('c:minimap', true);
    mp.events.callRemote('showHud:SERVER');
    mp.gui.chat.show(true);
}

function closeShop(sendRemote) {
    if (global.__clothesShopOpen !== true) return false;

    const browser = shopBrowser;
    if (browser && mp.browsers.exists(browser)) {
        try {
            browser.execute(
                'try{if(typeof window.donateShopClothesHide==="function")window.donateShopClothesHide();}catch(_e){}'
            );
        } catch (_e) {}
        browser.active = false;
    }

    global.__clothesShopOpen = false;
    clearOpeningState();
    if (cameraState && typeof global.destroyClothesShopCamera === 'function') {
        global.destroyClothesShopCamera(cameraState);
    }
    if (typeof global.clearClothesShopLocalPreview === 'function') {
        global.clearClothesShopLocalPreview();
    }

    mp.gui.cursor.show(false, false);
    mp.gui.cursor.visible = false;
    shopMode = null;
    shopList = [];
    selectedIndex = -1;
    selectedColor = 0;
    if (sendRemote !== false) mp.events.callRemote('clothes:close:s');
    showWorldUi();
    suppressPauseAfterClothesShopClose();
    return true;
}

global.closeFlowClothesShop = closeShop;

mp.events.add('flowClothesShop:open:c', (payloadJson) => {
    let payload = payloadJson;
    if (typeof payloadJson === 'string') {
        try {
            payload = JSON.parse(payloadJson);
        } catch (_e) {
            payload = null;
        }
    }
    if (!payload || !VALID_MODES.has(String(payload.mode)) || !Array.isArray(payload.list)) {
        clearOpeningState();
        mp.events.call('notify:client', 2, 'top-mid', 'Ошибка загрузки каталога одежды.', 3500);
        mp.events.callRemote('clothes:close:s');
        return;
    }

    clearOpeningState();
    shopMode = String(payload.mode);
    shopList = payload.list;
    selectedIndex = -1;
    selectedColor = 0;
    global.__clothesShopOpen = true;

    hideWorldUi();
    mp.gui.cursor.show(true, true);
    mp.gui.cursor.visible = true;
    if (typeof global.scheduleClothesShopLocalSnapshot === 'function') {
        global.scheduleClothesShopLocalSnapshot();
    }
    openCamera(shopMode);

    if (!showBrowser(payload)) {
        mp.events.call('notify:client', 2, 'top-mid', 'Не удалось открыть магазин одежды.', 3500);
        closeShop(true);
    }
});

mp.events.add('flowClothesShop:openFailed:c', () => {
    clearOpeningState();
});

rpc.on('__shopClothes_select', (index) => {
    if (global.__clothesShopOpen !== true) return;
    selectedIndex = Number(index);
    selectedColor = 0;
    applySelectedPreview();
});

rpc.on('__shopClothes_selectColor', (colorIndex) => {
    if (global.__clothesShopOpen !== true) return;
    selectedColor = Number(colorIndex) || 0;
    applySelectedPreview();
});

mp.events.add('__shopClotehs_cam', (bodyPart) => {
    if (global.__clothesShopOpen !== true || !cameraState) return;
    const clothId = BODY_PART_TO_CLOTH[String(Number(bodyPart))] || 3;
    global.setClothesShopCameraCategory(cameraState, clothId);
});

mp.events.add('__shopClotehs_rotatePlayer', (delta) => {
    if (global.__clothesShopOpen !== true) return;
    const amount = (Number(delta) || 0) * 0.45;
    if (!amount) return;
    const player = mp.players.local;
    player.setHeading(player.getHeading() + amount);
});

mp.events.add('client_menuManager_taskClose', (page) => {
    if (page === 'shop_clothes') closeShop(true);
});

mp.events.add('clothes:close:c', () => closeShop(true));
mp.events.add('clothes:donate:close:c', () => closeShop(true));
mp.events.add('clothes:spectrum:close:c', () => closeShop(true));

mp.events.add('clothes:donate:syncDp:c', () => {});
mp.events.add('spectrum:syncDp', () => {});

function tryCloseMode(mode) {
    if (global.__clothesShopOpen !== true || shopMode !== mode) return false;
    return closeShop(true);
}

global.tryCloseShopClothesEsc = () => tryCloseMode('regular');
global.tryCloseDonateClothesEsc = () => tryCloseMode('donate');
global.tryCloseSpectrumClothesEsc = () => tryCloseMode('spectrum');

function navigate(kind, direction) {
    if (global.__clothesShopOpen !== true || !shopBrowser || !mp.browsers.exists(shopBrowser)) return;
    const method = kind === 'clothes' ? 'navClothes' : 'navColor';
    const dir = Number(direction) < 0 ? -1 : 1;
    shopBrowser.execute(
        '(function(){try{var v=shopClothesMenu&&shopClothesMenu.vue;' +
        'if(v&&v.loaded&&typeof v.' +
        method +
        '==="function")v.' +
        method +
        '(' +
        dir +
        ');}catch(_e){}})();'
    );
}

mp.keys.bind(0x26, true, () => navigate('clothes', -1));
mp.keys.bind(0x28, true, () => navigate('clothes', 1));
mp.keys.bind(0x25, true, () => navigate('color', -1));
mp.keys.bind(0x27, true, () => navigate('color', 1));
