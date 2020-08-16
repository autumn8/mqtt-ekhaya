const { exec } = require('child_process');
const onTestPuppeteerIntent = require('./intents/testPuppeteerIntent');
const findSlotByName = (array, itemName)  => array.find(element => element.slotName === itemName);

function useIntentHandlers(client) {

    function onWakeUpIntent(topic, message) {
        console.log('wake up');
        client.publish("cmnd/living-room-lamp-tall/POWER", 'on');
        client.publish("cmnd/living-room-lamp-small/POWER", 'on');
      }
      
      function onSleepIntent(topic, message) {
        console.log('sleep');
        client.publish("cmnd/living-room-lamp-tall/POWER", 'off');
        client.publish("cmnd/living-room-lamp-small/POWER", 'off');
      }

      function onChangeLightStateIntent(topic, message) {
          const slots = JSON.parse(message.toString()).slots;
          console.log(slots);
          //const lightId =  findSlotByName(slots,'lightId');          
          const [state, lightId] =  slots;
          console.log("lightId", lightId.rawValue);
          console.log("state", state.rawValue);
          client.publish(`cmnd/living-room-lamp-${lightId.rawValue}/POWER`, state.rawValue);
      }

      function onChangeTVStateIntent(topic, message) {
        const slots = JSON.parse(message.toString()).slots;
        const [state] =  slots;
        console.log(state);
        const tvState = state.rawValue === 'on' ? 'on' : 'standby';
        console.log(tvState);
        exec(`echo '${tvState} 0' | cec-client -s -d 1`, (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
          });
      }

      function getRandomItem(arr) {
        const index = Math.floor(Math.random()* arr.length);
        return arr[index];
      }

      function getTwisterMove() {
        const colours = ['red', 'green', 'blue', 'yellow'];
        const side = ['left', 'right'];
        const extremity = ['foot', 'hand'];
        const randomSide = getRandomItem(side);
        return `${getRandomItem(side)} ${getRandomItem(extremity)} ${getRandomItem(colours)}` 
      }

      function onPlayTwisterIntent(topic, message) {
          console.log(topic);
          const sessionId = JSON.parse(message.toString()).sessionId;
          console.log(sessionId);
          const twisterMove = getTwisterMove();
          console.log(twisterMove);
          const payload = JSON.stringify({sessionId , text: twisterMove, intentFilter : ["NextTwisterMove"]});          
          client.publish(`hermes/dialogueManager/continueSession`, payload);
      }

      return {
          onWakeUpIntent,
          onSleepIntent,
          onChangeLightStateIntent,
          onChangeTVStateIntent,
          onTestPuppeteerIntent,
          onPlayTwisterIntent
      }
    
}


  module.exports = useIntentHandlers;