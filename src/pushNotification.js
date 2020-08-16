require('dotenv').config();

const Push = require('pushover-notifications')

const p = new Push({
    user: process.env.PUSHOVER_USER_TOKEN,
    token: process.env.PUSHOVER_APP_TOKEN,
});



function sendNotification(message, title, sound, imageData) {
    const notification = {
        message,
        title,
        sound,
        /* device: 's10', */
        priority: 1
    }
    if (imageData) notification.file = { name: 'detection.jpg', data: imageData } 

    p.send(notification, function (err, result) {
        if (err) {
            console.error(err);
        }
        console.log(result)
    })
}

module.exports = { sendNotification };