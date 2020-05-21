const functions = require("firebase-functions");
const mailgun = require("mailgun-js");

const config = {
  apiKey: functions.config().mailgun.apikey || process.env.mailgunApiKey,
  domain: functions.config().mailgun.domain || process.env.mailgunDomain,
  host: functions.config().mailgun.host || process.env.mailgunHost,
  permittedSender:
    functions.config().restrictions.permittedsender ||
    process.env.permittedSender,
  originalDomain:
    functions.config().restrictions.originaldomain ||
    process.env.originalDomain,
};

const handler = async (request, response) => {
  // Parse incoming POSTed message
  const { recipient, sender } = request.body;
  const bodyMime = request.body["body-mime"];

  // Restriction logic
  if (sender !== config.permittedSender) {
    response
      .status(406)
      .send(`The address ${sender} is not permitted to send this mail.`);
    return false;
  }

  // Redirect
  const newRecipient = recipient.replace(
    `@${config.originalDomain}`,
    `@${config.domain}`
  );

  // Re-send to subdomain address
  const mg = mailgun(config);
  const sendData = {
    to: newRecipient,
    message: bodyMime,
  };
  mg.messages().sendMime(sendData, (error, body) => {
    if (error) {
      response
        .status(500)
        .send(
          "There was an error returning the message to Mailgun for queueing. See logs for details."
        );
      console.error(error);
      return false;
    }
    // If no error, respond that all was successful
    console.info(body);
    response
      .status(200)
      .send("Message processed by Cecilian Mailing Lists function");
    return true;
  });
};

exports.processMessage_mime = functions
  .region("europe-west2")
  .https.onRequest(handler);
