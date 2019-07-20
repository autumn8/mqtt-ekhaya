const fs = require('fs');
const mqtt = require('mqtt');
const hostname = "mqtt://localhost:1883";
const client = mqtt.connect(hostname);
const { sendNotification } = require('./pushNotification');
let hasFrame = false;

const dogs1Audio = fs.readFileSync("./dogs1.wav");
const chimeAudio = fs.readFileSync('./chime.wav');

function toggleTallLivingRoomLampPower(intent) {  
  onOff = intent.slots[0].rawValue.toUpperCase();    
  client.publish('cmnd/living-room-lamp-tall/POWER', onOff);
  client.publish('hermes/audioServer/default/playBytes/chime', chimeAudio);        
}

function toggleSmallLivingRoomLampPower(intent) {
  const onOff = intent.slots[0].rawValue.toUpperCase(); 
  client.publish('cmnd/living-room-lamp-small/POWER', onOff);
}

function toggleBothLivingRoomLampsPower(intent) {
  const onOff = intent.slots[0].rawValue.toUpperCase();     
  client.publish('cmnd/living-room-lamp-tall/POWER', onOff);
  client.publish('cmnd/living-room-lamp-small/POWER', onOff); 
}

function toggleSecurityCameraStatus(intent) {
  console.log('instruction');
  if (!intent) console.log('Error', JSON.stringify(intent));
  const onOff = intent.slots[0].rawValue;   
  client.publish('hermes/dialogueManager/startSession',JSON.stringify(
    {
      init: {
        type: 'notification',
        text: `Turning cameras ${onOff}`
      }
    }));
}

function onCameraDetection(topic, message) {
  console.log('person detected');
  console.log(message);
  const routeSegments = topic.split("/");
  const cameraName = routeSegments[routeSegments.length - 1]; 
  const date = new Date();
  const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`; 
  sendNotification(`Person detected by ${cameraName} at ${time}`, 'Person Detected!','gamelan', message);
  client.publish('cmnd/living-room-lamp-tall/POWER', 'ON');
  setTimeout(()=> {
    client.publish('cmnd/living-room-lamp-small/POWER', 'ON');
  },5000); 
  client.publish('hermes/audioServer/default/playBytes/chime', dogs1Audio);  
}

function onMotionDetected(message) {
  console.log('motion detected');
  console.log(message);
  //client.publish('hermes/audioServer/default/playBytes/chime', chimeAudio); 
  const imageData = `data:image/jpeg;base64, ${message.toString("base64")}`;        
  client.unsubscribe('camera');
  sendNotification('Front door motion sensor triggered', 'Motion Detection','gamelan', null);
}

const handlers = {
  toggleTallLivingRoomLampPower,
  toggleSmallLivingRoomLampPower,
  toggleBothLivingRoomLampsPower,
  toggleSecurityCameraStatus, 
  onCameraDetection, 
  onMotionDetected
}

function onIntentDetected(intent) {  
  if (intent && intent.intent.intentName) {
    const intentName = intent.intent.intentName.replace('bradr:', '');    
    handlers[intentName](intent);
  }
}


client.on('connect', function () {
  client.subscribe('hermes/#'); 
  client.subscribe('camera/detection/frame/#'); 
  client.subscribe('camera/frame/#'); 
  client.subscribe('tele/sonoff/#');     
});

client.on('message', function (topic, message) {   
  console.log(topic);
  
  if (topic.match(/camera\/detection\/frame\/.+/g)!== null) {
    console.log(message);
    handlers.onCameraDetection(topic,message);
  }

  if (topic.match(/hermes\/intent\/.+/g) !== null) {
    onIntentDetected(JSON.parse(message));
  }

  if (topic == 'hermes/audioServer/default/playFinished') {
    console.log(JSON.parse(message));
  }  
  
  if (topic == 'tele/sonoff/RESULT') {
    console.log('tele');
    handlers.onMotionDetected(JSON.parse(message));
  }  
});





