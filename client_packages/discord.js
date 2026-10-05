let dstatus = 'Авторизируется на Flow DM';
let dstatuss = 'flowdm.fun/discord';

mp.events.add('dstatus', (s1, s2) => {
    dstatus = s1;
    dstatuss = s2;
});

mp.events.add('render', () => {
    mp.discord.update(dstatus, dstatuss);
});
