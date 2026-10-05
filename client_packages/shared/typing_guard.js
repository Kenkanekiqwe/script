'use strict';

/** Пока курсор в CEF input/textarea — не открывать анимации, чат и прочие бинды. */
global.__cefTextInputOpen = false;

global.isTypingInAnyTextField = function isTypingInAnyTextField() {
    try {
        if (global.__chatInputOpen === true) return true;
        if (global.__cefTextInputOpen === true) return true;
        if (mp.players.local && mp.players.local.isTypingInTextChat) return true;
        if (typeof global.isFamilyTabletOpen === 'function' && global.isFamilyTabletOpen()) return true;
    } catch (_e) {}
    return false;
};

mp.events.add('cef:textInput', (on) => {
    global.__cefTextInputOpen = on === true || on === 1 || on === '1';
});

const VK_ESCAPE = 0x1B;
try {
    const origBind = mp.keys.bind.bind(mp.keys);
    mp.keys.bind = function (key, keydown, handler) {
        if (typeof handler !== 'function') return origBind(key, keydown, handler);
        if (Number(key) === VK_ESCAPE) return origBind(key, keydown, handler);
        return origBind(key, keydown, function () {
            try {
                if (global.isTypingInAnyTextField && global.isTypingInAnyTextField()) return;
            } catch (_e) {}
            return handler.apply(this, arguments);
        });
    };
} catch (_ePatch) {}
