# Cecilian Mailing Lists

A Firebase Cloud Function to process messages POSTed from Mailgun, validate the sender, and return it to Mailgun if authorised, to then be distributed to a mailing list.

This is set up by having two domains in Mailgun, e.g. `example.com` and `ml.example.com`. On `example.com` a route is created named e.g. `list@example.com` - we will refer to this as the shadow address. The route is configured to POST messages sent to this address to the cloud function.

If the sender address is valid as determined by the function, the message is then re-POSTed to a mailing list on the `ml.example.com` domain. This list must have an identical name to the shadow address, so in this case, it would be called `list@ml.example.com`.

If the sender address is determined not to be valid, the message is rejected with a `406 (Not Acceptable)` status code, which tells Mailgun to stop trying to POST it. This effectively silently drops the message without further processing.

## Config

Config variables can be set with e.g.

```bash
firebase functions:config:set mailgun.host="api.eu.mailgun.net"
```

and a full list retrieved for inspection with

```bash
firebase functions:config:get
```

### Required Config Variables

This function requires config in the following format. If any keys are missing, the function will fail.

```json
{
  "mailgun": {
    "apikey": "Your Mailgun API key",
    "domain": "The domain to send to i.e. of the 'real' mailing list",
    "host": "api.eu.mailgun.net or api.mailgun.net"
  },
  "restrictions": {
    "originaldomain": "The domain of the shadow address",
    "permittedsender": "A single permitted sender address"
  }
}
```

## TODO

- refactor to allow for multiple permitted senders, and ideally, separate permitted senders for each different list
- refactor to receive parsed message (rather than MIME) from Mailgun
- add a footer (augment both text and HTML parts) with unsubscribe link
  (Make use of Mailgun's [personalised unsubscribe link variable](https://documentation.mailgun.com/en/latest/user_manual.html#mailing-lists): `%mailing_list_unsubscribe_url%`)
- reconstruct message on sending - just a case of matching
  the right [inputs](https://documentation.mailgun.com/en/latest/user_manual.html#routes)
  to the right [outputs](https://documentation.mailgun.com/en/latest/api-sending.html#sending).
- Inline images and attachments may be tricky here. The [Mailgun-JS library's handlers](http://highlycaffeinated.com/mailgun-js/#/attach) may help.
- This is also needed so we can rewrite the Reply-To header to match the sender of the original message. Currently it defults to `postmaster@ml.example.com` when POSTing via API.
- consider storing configuration data in Firebase (and retrieving via `firebase-admin` module) so it's more easily editable
- add some caller verification (probably via Mailgun's inbuilt webhook signing) to ensure only the correct Mailgun account can POST the endpoint
