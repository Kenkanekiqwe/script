/*
 * blood_shop.js — вкладка «Магазин» F10 (каталог как в C:\F10).
 * Категории: 0 = основные, 1 = оружие, 2 = транспорт.
 * VIP — отдельная вкладка shopTab === 1 в playermenu.html.
 * Цены совпадают с packages/server (s:buymenu / donate_privileges).
 */
(function () {
    var IMG = 'package://browsers/menunew/img/';
    var VEH = 'package://browsers/vehicle_previews/';

    function item(opts) {
        return Object.assign({
            purchaseType: 'donate',
            donateCategory: '',
            buyTrigger: '',
            description: '',
            extra: null
        }, opts);
    }

    function vehImg(model) {
        return VEH + model + '.png';
    }

    var CATALOG = [
        item({
            id: 'prefix',
            name: 'Личный префикс',
            price: 399,
            img: IMG + 'product_prefix2.png',
            category: 0,
            purchaseType: 'prefix',
            donateCategory: 'Privilege',
            buyTrigger: 'OwnPrefix',
            description: 'Личный префикс в чате навсегда (3–10 символов).'
        }),
        item({
            id: 'login',
            name: 'Смена логина',
            price: 199,
            img: IMG + 'productChangelogin2.png',
            category: 0,
            purchaseType: 'login',
            description: 'Смена логина персонажа.'
        }),
        item({
            id: 'GangwarChangeAppearance',
            name: 'Смена внешности',
            price: 150,
            img: IMG + 'productChangelogin2.png',
            category: 0,
            donateCategory: 'GangwarOthers',
            buyTrigger: 'GangwarChangeAppearance',
            description: 'Полная смена внешности персонажа. Оплата списывается после сохранения в редакторе.'
        }),
        item({
            id: 'dp_exchange',
            name: 'Игровая валюта',
            price: 1,
            img: IMG + 'productMoney2.svg',
            category: 0,
            purchaseType: 'exchange',
            description: 'Обмен DP на игровые деньги.'
        }),
        item({
            id: 'BongPipe',
            name: 'Трубка Bong',
            price: 200,
            img: IMG + 'bong.png',
            category: 0,
            donateCategory: 'GangwarOthers',
            buyTrigger: 'BongPipe',
            description: 'Усиливает Spank — резист 240 сек. Трубка навсегда, расходуется только Spank.'
        }),
        item({
            id: 'ThermosMug',
            name: 'Термокружка',
            price: 300,
            img: IMG + 'thermos.png',
            category: 0,
            donateCategory: 'GangwarOthers',
            buyTrigger: 'ThermosMug',
            description: 'Пить Медовуху через термокружку — алко-резист 240 сек. Кружка навсегда, расходуется только Медовуха.'
        }),
        item({
            id: 'DroneSystem',
            name: 'Дрон',
            price: 500,
            img: IMG + 'drone.png',
            category: 0,
            donateCategory: 'GangwarOthers',
            buyTrigger: 'DroneSystem',
            description: 'Управляемый дрон с камерой. Использовать из инвентаря. N — камера, F6/F7 — ночь/тепло, ПКМ — шокер.'
        }),
        item({
            id: 'weapon_heavysniper_mk2',
            name: 'Heavy Sniper MKII',
            price: 2000,
            img: IMG + 'boxes/weapon_heavysniper_mk2.png',
            category: 1,
            donateCategory: 'Weapon',
            buyTrigger: 'weapon_heavysniper_mk2',
            description: 'Heavy Sniper MKII для GANGWAR. После покупки оружие в инвентаре.'
        }),
        item({
            id: 'temerario',
            name: 'Pegassi Temario 2025',
            price: 2500,
            img: vehImg('temerario'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'temerario'
        }),
        item({
            id: 'tourbillon',
            name: 'Truffade Billion 2026',
            price: 500,
            img: vehImg('tourbillon'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'tourbillon'
        }),
        item({
            id: 'urus24',
            name: 'Pegassi Ursus 2024',
            price: 1750,
            img: vehImg('urus24'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'urus24'
        }),
        item({
            id: 'avtr',
            name: 'Mercedes-Benz Vision AVTR',
            price: 1400,
            img: vehImg('avtr'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'avtr'
        }),
        item({
            id: 'amgone1',
            name: 'Benefactor ASG P-One',
            price: 600,
            img: vehImg('amgone1'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'amgone1'
        }),
        item({
            id: '812superfast',
            name: 'Grotti 821 SP 2017',
            price: 550,
            img: vehImg('812superfast'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: '812superfast'
        }),
        item({
            id: 'cilindri12',
            name: 'Grotti 12Cil 2025',
            price: 2750,
            img: vehImg('cilindri12'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'cilindri12'
        }),
        item({
            id: 'kabluk',
            name: 'Highheel',
            price: 500,
            img: vehImg('kabluk'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'kabluk'
        }),
        item({
            id: 'neverar',
            name: 'Coil Reverand R 2025',
            price: 1250,
            img: vehImg('neverar'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'neverar'
        }),
        item({
            id: 'nsx18',
            name: 'Dinka NSY 2018',
            price: 925,
            img: vehImg('nsx18'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'nsx18'
        }),
        item({
            id: 'gta5rp_veh_ferrari19',
            name: 'Grotti Ascenda',
            price: 1375,
            img: vehImg('gta5rp_veh_ferrari19'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'gta5rp_veh_ferrari19'
        }),
        item({
            id: 'i8',
            name: 'Ubermacht I8',
            price: 350,
            img: vehImg('i8'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 'i8'
        }),
        item({
            id: 's1000rr',
            name: 'Ubermacht S1000GG',
            price: 825,
            img: vehImg('s1000rr'),
            category: 2,
            donateCategory: 'Vehicles',
            buyTrigger: 's1000rr'
        }),
        item({
            id: 'skateboard',
            name: 'Скейтборд',
            price: 400,
            img: IMG + 'skateborde.png',
            category: 2,
            donateCategory: 'GangwarOthers',
            buyTrigger: 'skateboard',
            description: 'Скейтборд навсегда. Уникальная раскраска deck. «Использовать» — взять в руки, F — сесть.'
        })
    ];

    window.BLOOD_SHOP_CATALOG = CATALOG;

    function trig() {
        try { return window.mp.trigger.apply(window.mp, arguments); } catch (e) {}
    }

    function getList(tab) {
        return CATALOG.filter(function (i) { return i.category === tab; });
    }

    window.bloodShopGetList = getList;

    window.bloodShopBuyItem = function (shopItem, form) {
        form = form || {};
        if (!shopItem) return false;
        switch (shopItem.purchaseType) {
            case 'prefix':
                var prefix = String(form.prefix || '').trim();
                if (prefix.length < 3 || prefix.length > 10) return false;
                trig('DonateBuyItem', 'Privilege', 'OwnPrefix', prefix);
                return true;
            case 'login':
                if (!String(form.login || '').trim()) return false;
                trig('PlayerChangeLoginDonate', String(form.login).trim());
                return true;
            case 'exchange':
                var amt = parseInt(form.exchangeDp, 10);
                if (!isFinite(amt) || amt < 1) return false;
                trig('obmendpm', amt);
                return true;
            default:
                trig('DonateBuyItem', shopItem.donateCategory, shopItem.buyTrigger, shopItem.extra != null ? shopItem.extra : '');
                return true;
        }
    };

    function refreshList(v) {
        var tab = v.shopCategoryTab || 0;
        var list = getList(tab);
        if (v.$set) v.$set(v, 'bloodShopList', list);
        else v.bloodShopList = list;
    }

    function patchVue(v) {
        if (!v) return;

        if (v.bloodShopFormPrefix == null) {
            if (v.$set) {
                v.$set(v, 'bloodShopFormPrefix', '');
                v.$set(v, 'bloodShopFormLogin', '');
                v.$set(v, 'bloodShopFormExchange', '');
                v.$set(v, 'bloodShopFormCandyPacks', '');
                v.$set(v, 'bloodShopList', getList(v.shopCategoryTab || 0));
            } else {
                v.bloodShopFormPrefix = '';
                v.bloodShopFormLogin = '';
                v.bloodShopFormExchange = '';
                v.bloodShopFormCandyPacks = '';
                v.bloodShopList = getList(v.shopCategoryTab || 0);
            }
        }
        if (!Array.isArray(v.bloodShopList) || !v.bloodShopList.length) refreshList(v);

        v.bloodOpenRoulette = function () {
            try {
                if (window.LRoulette && typeof window.LRoulette.open === 'function') window.LRoulette.open();
            } catch (_e) {}
        };
        v.openPlayerDonateRoulette = v.bloodOpenRoulette;
        v.openDonateRoulette = v.bloodOpenRoulette;

        v.bloodSelectShopItem = function (item, index) {
            this.selectedBonusShopItem = item || null;
            this.selectedBonusShopItemIndex = index == null ? -1 : index;
            this.bonusPointFormSubIndex = 0;
        };

        v.bloodShopSelectCategory = function (tab) {
            this.shopCategoryTab = parseInt(tab, 10) || 0;
            this.shopTab = 0;
            this.selectedBonusShopItem = null;
            refreshList(this);
        };

        if (v.__bloodShopPatched) return;
        v.__bloodShopPatched = true;

        v.bonusShopBuy = async function () {
            var shopItem = this.selectedBonusShopItem;
            if (!shopItem) return;
            try {
                var ok = window.bloodShopBuyItem(shopItem, {
                    prefix: this.bloodShopFormPrefix,
                    login: this.bloodShopFormLogin,
                    exchangeDp: this.bloodShopFormExchange
                });
                if (!ok) {
                    if (typeof serverAPI !== 'undefined' && serverAPI.notifyError) {
                        serverAPI.notifyError('Заполните все поля');
                    }
                    return;
                }
                setTimeout(function () {
                    try { trig('menuAccountProfileRequest'); } catch (_eDp) {}
                }, 600);
            } catch (e) {
                if (typeof serverAPI !== 'undefined' && serverAPI.notifyError) serverAPI.notifyError(String(e));
            }
            this.selectedBonusShopItem = null;
            this.bloodShopFormPrefix = '';
            this.bloodShopFormLogin = '';
            this.bloodShopFormExchange = '';
            this.bloodShopFormCandyPacks = '';
        };
    }

    function tryPatch() {
        if (typeof window.palyerMainMenuMenu === 'undefined') return false;
        var v = window.palyerMainMenuMenu.vue;
        if (!v) return false;
        patchVue(v);
        return true;
    }

    tryPatch();
    var tries = 0;
    var iv = setInterval(function () {
        tries++;
        if (tryPatch() || tries > 100) clearInterval(iv);
    }, 200);
})();
