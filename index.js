const fs = require('fs');
const { MilightController, discoverBridges, helper, commandsV6 } = require('node-milight-promise');
const emoji = require('node-emoji')
const { RTMClient, WebClient, LogLevel } = require('@slack/client');

const token = fs.readFileSync('./token.key').toString();
const logLevel = LogLevel.ERROR;
const timeOut = 20000;
const keyword = 'roby';
const welcomeMsg = `Hello, I'm Roby :traffic_light: :robot_face: !\nType: roby for help.`;

let channel, light;

process.on('unhandledRejection', error => {
  console.error('unhandledRejection', error);
  process.exit(1);
});

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
  const connectionInfo = await rtm.start();
  const res = await web.channels.list()
  channel = res.channels.find(c => c.is_member);
  const bridges = await discoverBridges({ type: 'all' });
  const firstBridge = bridges.find( bridge =>  bridge);

  light = new MilightController({
    ip: firstBridge.ip,
    type: firstBridge.type
  }),
  console.log('Connection: ', connectionInfo.team.name);
  console.log('Bridges: ', firstBridge.ip, firstBridge.type);
  console.log('Light: ', light.ip);

  sendMessage(welcomeMsg);
  firstBridge.length === 0 ?
    sendMessage('No light bridges found') :
    sendMessage('Found bridge: ' + Object.values(firstBridge).join(' / ') );
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

const processCommand = async (commandAndParameters) => {
  console.log('Executing', commandAndParameters);
  const commandAndParametersArray = commandAndParameters.trim().split(' ');
  if(commandAndParametersArray[0] !== '' && commands[commandAndParametersArray[0]] ){
    return commands[commandAndParametersArray[0]].apply(this, commandAndParametersArray.slice(1));
  } else {
    return `[${commandAndParameters}] not found. Availible commends: ` + Object.keys(commands);
  }
}

const commands = {
  milight: async (zone, parameter, extra) => {
    zone = parseInt(zone);
    const cmd = commandsV6.rgbw[parameter](zone, extra);
    const result  = await light.sendCommands(cmd);
    return `Milight ${parameter}`;
  }
}
