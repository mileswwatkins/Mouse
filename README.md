# Mouse 🐭

A chatbot to provide information to backcountry hikers via satellite SMS, such as on a Garmin InReach.

<p align="center">
    <img src="https://github.com/mileswwatkins/Mouse/blob/main/README-weather-screenshot.png?raw=true" style="height: 400px;" />
</p>

## How do I get access to Mouse?

Mouse is currently in beta, so you'll need to ask the developer (Miles Watkins) for Mouse's phone number. Once you have that phone number, you can text it from your Garmin InReach or other SMS-capable device.

## What can I ask Mouse?

### Weather forecasts

_The user must have be using a Garmin InReach with location sharing turned on, in which case there will be an `inreachlink.com/#######` automatically appended to the message. This link can be used to determine your GPS location and thus fetch your weather forecast._

##### Your message

```weather```

##### Mouse's response

```text
2-day forecast for 16 Miles W Lone Pine CA, elevation 10981 ft

Today: Areas of smoke. Partly sunny, high of 49. SSW wind 10-15 mph.

Tonight: Widespread haze before 11pm. Mostly cloudy, then gradually becoming mostly clear, low of 31. SSW wind around 5 mph.

Thu Night: A 20% chance of snow showers after 11pm.  Partly cloudy, low of 27. W wind 10-15 mph.

Thu: Widespread haze between noon and 3pm. Sunny, high of 48. SSW wind 5-10 mph increasing to 10-15 mph in the afternoon. Gusts of 25 mph.
```

### Trail closures

_"Closure" here includes any safety notices, detours, updates, or hazards posted by the trail authority. Currently only supports [the Pacific Crest Trail](https://www.pcta.org)._

#### Number of closures in each region

##### Your message

```closures```

##### Mouse's response

```text
Closures by region: Southern California 5, Central California 0, Northern California 5, Oregon 1, Washington 3
```

#### List of closures in a specific region

##### Your message

```closures northern california```

##### Mouse's response

```text
[1] Dec 20 2021 closure: Caldor Fire in the Lake Tahoe region

[2] Dec 14 2021 reopening: River Complex Fires and McCash Fire in Klamath National Forest

[3] Dec 10 2021 closure: Dixie Fire

[4] Jun 23 2021 warning: Private timberlandcampingclosures in Northern Californiadue to fire risk

[5] Dec 14 2021 warning: North Complex (Claremont-Bear Fire) near Quincy, CA
```

#### Details on a specific closure

_The number refers to which closure item in the list you would like to access._

##### Your message

```closures northern california 3```

##### Mouse's response

```text
Updated 12/10 9:20 AM
The Pacific Crest Trail is closed near Warner Valley Road in the southern part of Lassen National Park. The rest of the Dixie Fire closures have been lifted, but Lassen National Forest stated in their press release that a closure order may be reinstated once restoration work begins in spring 2022.
```

## Development

This project runs on the serverless architecture of Twilio Functions.

### Requirements

- A Twilio account and active phone number
- Node 12
- `npm install`
- `npm install twilio-cli --global`
- `twilio login`
- `twilio plugins:install @twilio-labs/plugin-serverless`

### Running locally

```sh
twilio serverless:start
```

Then, you should be able to make HTTP POST requests to `http://localhost:3000/mouse`, making sure to include your desired message in the `Body` property of your POST data, eg:

```sh
curl http://localhost:3000/mouse \
    --request POST \
    --data '{"Body":"closures"}' \
    --header "Content-Type: application/json"

<?xml version="1.0" encoding="UTF-8"?><Response><Message>Closures by region: Southern California 5, Central California 0, Northern California 5, Oregon 1, Washington 3</Message><Message>To get a list of all closures in a region, include that region's name in your text (eg, text `closures central california`)</Message></Response>%
```

### Deploying

- `twilio serverless:deploy`, which will (assuming success) print `Deployment Details`, which includes Mouse's Twilio Function's URL (eg `https://mouse-1234-dev.twil.io/mouse`)
- In the Twilio web console, navigate to your phone number, scroll down to the `Messaging` section, and in the `A MESSAGE COMES IN` section set your Webhook field to Mouse's URL
  - You'll only need to edit this field once; all future `twilio serverless:deploy` commands will deploy Mouse to the same URL (since the service ID is saved in a gitignore'd `.twiliodeployinfo` file)
