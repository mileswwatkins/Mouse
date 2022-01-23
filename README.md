# Mouse 🐭

A chatbot to provide information to backcountry hikers via satellite SMS, such as on a Garmin InReach.

<p align="center">
    <img src="https://github.com/mileswwatkins/Mouse/blob/main/README-weather-screenshot.png?raw=true" style="height: 400px;" />
</p>

## A note about safety

The backcountry can be dangerous, and Mouse is _not_ a safety tool. You shouldn't depend on Mouse's information when making decisions, especially regarding hazardous weather or wildfires.

## How do I get access to Mouse?

Mouse is currently in beta, so you'll need to ask the developer (Miles Watkins) for Mouse's phone number. Once you have that phone number, you can text it from your Garmin InReach or other SMS-capable device.

Please only use Mouse on your satellite communication device if you pay for a plan with unlimited text messages! Mouse's responses can be long (ie, multiple messages) and quickly eat up your plan otherwise.

## What can I ask Mouse?

### Weather forecasts

_The user must be using a Garmin InReach with location sharing turned on, in which case there will be an `inreachlink.com/#######` automatically appended to each text message the user sends. This link can be used to determine your GPS location and thus fetch your weather forecast._

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

#### Number of closures in each region of a trail

##### Your message

```closures pct```

##### Mouse's response

```text
Closures by region: Southern California 5, Central California 0, Northern California 5, Oregon 1, Washington 3
```

#### List of closures in a specific region of a trail

##### Your message

```closures pct northern california```

##### Mouse's response

```text
[1] Dec 20 2021 closure: Caldor Fire in the Lake Tahoe region

[2] Dec 14 2021 reopening: River Complex Fires and McCash Fire in Klamath National Forest

[3] Dec 10 2021 closure: Dixie Fire

[4] Jun 23 2021 warning: Private timberlandcampingclosures in Northern Californiadue to fire risk

[5] Dec 14 2021 warning: North Complex (Claremont-Bear Fire) near Quincy, CA
```

#### Details on a specific closure

_The number refers to which closure item in the list you would like to access. Only the first paragraph of the closure notice is included._

##### Your message

```closures pct northern california 3```

##### Mouse's response

```text
Updated 12/10 9:20 AM The Pacific Crest Trail is closed near Warner Valley Road in the southern part of Lassen National Park. The rest of the Dixie Fire closures have been lifted, but Lassen National Forest stated in their press release that a closure order may be reinstated once restoration work begins in spring 2022.
```

### Wikipedia

You can fetch the first paragraph of any Wikipedia article. Note that searching for an ambiguous or overly broad term (eg, `Smith`) will not return useful results.

##### Your message

```wikipedia pokemon```

##### Mouse's response

```text
Pokémon is a Japanese media franchise managed by The Pokémon Company, a company founded by Nintendo, Game Freak, and Creatures. The franchise was created by Satoshi Tajiri in 1996, and is centered on fictional creatures called "Pokémon". In Pokémon, humans, known as Pokémon Trainers, catch and train Pokémon to battle other Pokémon for sport. All media works within the franchise are set in the Pokémon universe. The English slogan for the franchise is "Gotta Catch ‘Em All!". There are currently 901 Pokémon species.
```

## Development

This project runs on the serverless architecture of Twilio Functions.

### Requirements

- Node 12
- `npm install`

And if you want to deploy instead of just running/testing locally, then also:

- A Twilio account and active phone number
- Populating a `.env` file or your shell environment with your Twilio `ACCOUNT_SID` and `AUTH_TOKEN`

### Tests

- `npm run test` runs all unit tests
- `npm run test-watch` runs a daemon that runs tests for all files that have changed since your last Git commit
- `npm run test-e2e` runs the end-to-end tests, that make actual HTTP requests

This project also uses Husky to propagate pre-commit Git hooks. Any new commit will trigger the unit tests, and commits on the `main` branch will trigger the end-to-end tests as well.

### Running locally

```sh
npm run start
```

Then, you should be able to make HTTP POST requests to `http://localhost:3000/mouse`, making sure to include your desired message in the `Body` property of your POST data, eg:

```sh
curl http://localhost:3000/mouse \
    --request POST \
    --data '{"Body":"closures pct"}' \
    --header "Content-Type: application/json"

<?xml version="1.0" encoding="UTF-8"?><Response><Message>Closures by region: Southern California 5, Central California 0, Northern California 5, Oregon 1, Washington 3</Message><Message>To get a list of all closures in a region, include that region's name in your text (eg, text `closures central california`)</Message></Response>%
```

### Deploying

- `npm run deploy`, which will (assuming success) print `Deployment Details`, which includes Mouse's Twilio Function's URL (eg `https://mouse-1234-dev.twil.io/mouse`)
- In the Twilio web console, navigate to your phone number, scroll down to the `Messaging` section, and in the `A MESSAGE COMES IN` section set your Webhook field to Mouse's URL
  - You'll only need to edit this field once; all future `npm run deploy` commands will deploy Mouse to the same URL (since the service ID is saved in a gitignore'd `.twiliodeployinfo` file)
