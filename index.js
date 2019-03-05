const fs = require('fs');
const { RTMClient, WebClient, LogLevel } = require('@slack/client');

const token = fs.readFileSync('./token.key').toString();
const logLevel = LogLevel.ERROR;
const timeOut = 20000;

const rtm = new RTMClient(token,
  {
    logLevel,
    autoReconnect: true,
    clientPingTimeout: timeOut,
    serverPongTimeout: timeOut - 1000
  }
);

rtm.start();

const web = new WebClient(token, { logLevel });

rtm.on('message', (message) => {
  const keyword = 'milight'

  if (message.type === 'message' && (message.text || message.attachments.length > 0)) {

    let messageText = message.text ? message.text : message.attachments[0].pretext;
    
    messageText = messageText.toLowerCase();
    if (messageText.indexOf(keyword) === 0) {
      const command = messageText.replace(keyword, '').trim();
      console.log('Lights: ', command);
    }
  }
});

(async () => {
  // Load the current channels list asynchronously
  const res = await web.channels.list()

  // Take any channel for which the bot is a member
  const channel = res.channels.find(c => c.is_member);

  if (channel) {
    let welcomeMsg = `Hello, I\'m Roby, Welcome to ${channel.name} !\n`;
    welcomeMsg += `Type \`\`\`milight on/off/red/blue/disco\`\`\` to change the lights.`;

    const msg = await rtm.sendMessage(welcomeMsg, channel.id);
    console.log(`Message sent to channel ${channel.name} with ts:${msg.ts}`);
  } else {
    console.log('This bot does not belong to any channel, invite it to at least one and try again');
  }
})();
