const fs = require('fs');
var player = require('play-sound')(opts = {});
const { exec } = require('child_process');
const chimeAudio = fs.readFileSync('./audio/chime.wav');


const SENSORS = {
  'E9CF99': 'Front Door Sensor',
  'EF3C2E': 'Front Door Motion Sensor',
  'EE737E': 'Garden Motion Sensor'
}


// setTimeout(() => {
//   console.log('kill audio');
//   dogs.kill();
// }, 10);


// player.play('./audio/dogs1.wav', function(err){
//   console.log('play dog audio');
//   if (err && !err.killed) throw err
// });

const motionSensorNotificationPeriod = 600000;
let gardenMotionLastSensorTime = 0;

var mqtt = require('mqtt');
const useIntentHandlers = require('./intentHandlers');
var client = mqtt.connect('mqtt://192.168.8.202', { username: 'ekhaya', password: 'keepMeSaf3' });
const {onSleepIntent, onWakeUpIntent, onChangeLightStateIntent, onChangeTVStateIntent, onTestPuppeteerIntent, onPlayTwisterIntent} = useIntentHandlers(client);

function onBridgeSensorEvent(topic, message) {
  const sensorID = JSON.parse(message.toString()).RfReceived.Data;
  console.log(SENSORS[sensorID]);
  if (!SENSORS[sensorID]) return;
  if (SENSORS[sensorID] === 'Garden Motion Sensor') {
    const currentTime = Date.now();
    if (currentTime - gardenMotionLastSensorTime < motionSensorNotificationPeriod) return;
    client.publish(
      `led/garden_camera/on`,
      JSON.stringify({ color: [255, 255, 255], brightness: 1 }),
      { retain: true }
    );
    client.publish('hermes/audioServer/default/playBytes/chime', chimeAudio);
    setTimeout(() => {
      client.publish(
        `led/garden_camera/off`,
        '',
        { retain: true }
      );
    }, 60000);
    gardenMotionLastSensorTime = currentTime;
  }  
  console.log('intruder');  
}

function onHermesIntentEvent(topic, message) {
  console.log(topic);
  console.log(JSON.parse(message));
}

function onTVPowerEvent(topic, message) {
  const state = message.toString();

  exec(`echo '${state} 0' | cec-client -s -d 1`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
  console.log('play audio');
  player.play('./audio/chime.wav', function (err) {
    if (err && !err.killed) throw err
  });
}


client.on('connect', function () {
  console.log('connect');
  client.subscribe('hermes/intent/#');
  client.subscribe('hermes/dialogManager/#');
  client.subscribe('hermes/hotword/#');  
  client.subscribe('tele/sonoff/RESULT', (err) => {
    //client.publish('hermes/audioServer/default/playBytes/chime', chimeAudio); 
    client.publish('hermes/tts/say', JSON.stringify({ text: 'Connected to MQTT client' }));
    if (err) {
      console.log('error subscribing to sonoff lights');

    }
  });
  client.subscribe('tv/POWER', (err) => {
    if (err) {
      console.log('error subscribing to sonoff lights');
    }
  });
});

const messageRouter = {
  'tele/sonoff/RESULT': onBridgeSensorEvent,
  'tv/POWER': onTVPowerEvent,
  'hermes/intent': onHermesIntentEvent
}

// function onWakeUpIntent(topic, message) {
//   console.log('wake up');
//   client.publish("cmnd/living-room-lamp-tall/POWER", 'on');
//   client.publish("cmnd/living-room-lamp-small/POWER", 'on');
// }

// function onSleepIntent(topic, message) {
//   console.log('sleep');
//   client.publish("cmnd/living-room-lamp-tall/POWER", 'off');
//   client.publish("cmnd/living-room-lamp-small/POWER", 'off');
// }

client.on('message', function (topic, message) {  
  if (topic ==='tele/sonoff/RESULT') onBridgeSensorEvent(topic, message);
  if (topic === 'hermes/intent/WakeUp') onWakeUpIntent(topic, message);
  if (topic === 'hermes/intent/Sleep') onSleepIntent(topic, message);
  if (topic === 'hermes/intent/ChangeLightState') onChangeLightStateIntent(topic, message);
  if (topic === 'hermes/intent/ChangeTVState') onChangeTVStateIntent(topic, message);
  if (topic === 'tv/POWER') onTVPowerEvent(topic, message);
  if (topic === 'hermes/intent/TestPuppeteer') onTestPuppeteerIntent(topic, message);
  if (topic === 'hermes/intent/PlayTwister') onPlayTwisterIntent(topic, message);
  if (topic === 'hermes/intent/NextTwisterMove') onPlayTwisterIntent(topic, message);
  if (topic.includes('hermes/dialogManager/')) {
    console.log("DIALOG");
    console.log(topic);
    console.log(message.toString());
  }
  if (topic.match(/hermes\/hotword\/.+/g) !== null) {
    console.log("HOTWORD");
    console.log(topic);
    console.log(message.toString());
  }  
});





// const fs = require('fs');
// const mqtt = require('mqtt');
// const hostname = "mqtt://localhost:1883";
// const client = mqtt.connect(hostname);
// const { sendNotification } = require('./pushNotification');
// let hasFrame = false;

// const dogs1Audio = fs.readFileSync("./dogs1.wav");
// const chimeAudio = fs.readFileSync('./chime.wav');

// function toggleTallLivingRoomLampPower(intent) {  
//   onOff = intent.slots[0].rawValue.toUpperCase();    
//   client.publish('cmnd/living-room-lamp-tall/POWER', onOff);
//   client.publish('hermes/audioServer/default/playBytes/chime', chimeAudio);        
// }

// function toggleSmallLivingRoomLampPower(intent) {
//   const onOff = intent.slots[0].rawValue.toUpperCase(); 
//   client.publish('cmnd/living-room-lamp-small/POWER', onOff);
// }

// function toggleBothLivingRoomLampsPower(intent) {
//   const onOff = intent.slots[0].rawValue.toUpperCase();     
//   client.publish('cmnd/living-room-lamp-tall/POWER', onOff);
//   client.publish('cmnd/living-room-lamp-small/POWER', onOff); 
// }

// function toggleSecurityCameraStatus(intent) {
//   console.log('instruction');
//   if (!intent) console.log('Error', JSON.stringify(intent));
//   const onOff = intent.slots[0].rawValue;   
//   client.publish('hermes/dialogueManager/startSession',JSON.stringify(
//     {
//       init: {
//         type: 'notification',
//         text: `Turning cameras ${onOff}`
//       }
//     }));
// }

// function onCameraDetection(topic, message) {
//   console.log('person detected');
//   console.log(message);
//   const routeSegments = topic.split("/");
//   const cameraName = routeSegments[routeSegments.length - 1]; 
//   const date = new Date();
//   const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`; 
//   sendNotification(`Person detected by ${cameraName} at ${time}`, 'Person Detected!','gamelan', message);
//   client.publish('cmnd/living-room-lamp-tall/POWER', 'ON');
//   setTimeout(()=> {
//     client.publish('cmnd/living-room-lamp-small/POWER', 'ON');
//   },5000); 
//   client.publish('hermes/audioServer/default/playBytes/chime', dogs1Audio);  
// }

// function onMotionDetected(message) {
//   console.log('motion detected');
//   console.log(message);
//   //client.publish('hermes/audioServer/default/playBytes/chime', chimeAudio); 
//   const imageData = `data:image/jpeg;base64, ${message.toString("base64")}`;        
//   client.unsubscribe('camera');
//   sendNotification('Front door motion sensor triggered', 'Motion Detection','gamelan', null);
// }

// const handlers = {
//   toggleTallLivingRoomLampPower,
//   toggleSmallLivingRoomLampPower,
//   toggleBothLivingRoomLampsPower,
//   toggleSecurityCameraStatus, 
//   onCameraDetection, 
//   onMotionDetected
// }

// function onIntentDetected(intent) {  
//   if (intent && intent.intent.intentName) {
//     const intentName = intent.intent.intentName.replace('bradr:', '');    
//     handlers[intentName](intent);
//   }
// }


// client.on('connect', function () {
//   client.subscribe('hermes/#'); 
//   client.subscribe('camera/detection/frame/#'); 
//   client.subscribe('camera/frame/#'); 
//   client.subscribe('tele/sonoff/#');     
// });

// client.on('message', function (topic, message) {   
//   console.log(topic);

//   if (topic.match(/camera\/detection\/frame\/.+/g)!== null) {
//     console.log(message);
//     handlers.onCameraDetection(topic,message);
//   }

//   if (topic.match(/hermes\/intent\/.+/g) !== null) {
//     onIntentDetected(JSON.parse(message));
//   }

//   if (topic == 'hermes/audioServer/default/playFinished') {
//     console.log(JSON.parse(message));
//   }  

//   if (topic == 'tele/sonoff/RESULT') {
//     console.log('tele');
//     handlers.onMotionDetected(JSON.parse(message));
//   }  
// });




