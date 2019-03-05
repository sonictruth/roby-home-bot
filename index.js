const fs = require('fs');
const { MilightController, discoverBridges, helper, commandsV6 } = require('node-milight-promise');
const emoji = require('node-emoji')
const { RTMClient, WebClient, LogLevel } = require('@slack/client');

const token = fs.readFileSync('./token.key').toString();
const logLevel = LogLevel.ERROR;
const timeOut = 20000;
const keyword = 'roby';

const welcomeMsg = `Hello, I'm Roby :traffic_light: :robot_face: !\n` +
  'Type: ```' + keyword + ' milight on/off/red/blue/disco``` to change the lights.';

let channel;

process.on('unhandledRejection', error => {
  console.error('unhandledRejection', error);
  process.exit(1);
});


/*
const light = new MilightController({
  ip: "255.255.255.255",
  type: 'v6'
}),
  zone = 1;
*/

const rtm = new RTMClient(token,
  {
    logLevel,
    autoReconnect: true,
    clientPingTimeout: timeOut,
    serverPongTimeout: timeOut - 1000
  }
);

const web = new WebClient(token,
  { logLevel }
);


// Start bot
(async () => {
  const bridges = await discoverBridges({type: 'all'});
  const connectionInfo = await rtm.start();
  const res = await web.channels.list()

  channel = res.channels.find(c => c.is_member);
  sendMessage(welcomeMsg);
})();

rtm.on('message', async (message) => {
  if (message.type === 'message' && (message.text || message.attachments.length > 0)) {
    let messageText = message.text ? message.text : message.attachments[0].pretext;
    messageText = messageText.toLowerCase();
    if (messageText.indexOf(keyword) === 0) {
      const command = messageText.replace(keyword, '').trim();
      const response = await processCommand(command);
      sendMessage(response);
    }
  }
});

const sendMessage = async (message) => {
  if (channel) {
    const msg = await rtm.sendMessage(emoji.emojify(message), channel.id);
    console.log(`Sent message to ${channel.name} with ts:${msg.ts}`);
  } else {
    console.log('This bot does not belong to any channel, invite it to at least one and try again');
  }
}

const processCommand = async (command) => {
  console.log('Executing', command);
  return `${command} done.`;
}
