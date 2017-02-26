'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const Wit = require('node-wit').Wit;
const token = "7FT3FOM7CGM2AAN2K7OST6H7WOFGGTGS";
const apiKey = "338fcef200d92da1408c75043a3a1c7c";
const baseUrl = 'https://api.openweathermap.org/data/2.5/weather?appid='+apiKey;
const locParam = '&q=';
const sessionId = 'my-user-session-42';
const log = require('node-wit').log;
const users = require('./routes/users');
const request = require('request');
const http = require('http');
const Client = require('node-rest-client').Client;

const {DEFAULT_MAX_STEPS} = require('./lib/config');
const logger = require('./lib/log.js');
const readline = require('readline');
const uuid = require('uuid');

mongoose.connect('mongodb://localhost/chat');
mongoose.Promise = require('bluebird');

const app = express();
const client = new Client();

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    return new Promise(function(resolve, reject) {
      console.log('sending...', JSON.stringify(response));
      return resolve();
    });
  },
  getForecast({context, entities}) {
    return new Promise(function(resolve, reject) {
      let location = firstEntityValue(entities, "location");
      let data;
        request('http://api.openweathermap.org/data/2.5/weather?appid=338fcef200d92da1408c75043a3a1c7c&q='+location, function (error, response, body) {
		    	var jsonData = JSON.parse(body);
          data = jsonData;
          console.log(data);
          context.forecast = jsonData;
          return resolve(context);
        });
    });
  },
  // getRain({context, entities}) {
  //   return new Promise(function(resolve, reject) {
  //     context.rain = "It won't rain.";
  //     return resolve(context);
  //   });
  // },
  // getForcastTime({context, entities}) {
  //   return new Promise(function(resolve, reject) {
  //     let time = firstEntityValue(entities, "datetime");
  //     context.forecast = "Weather will be nice on " + time;
  //     return resolve(context);
  //   });
  // },
};

const wit = new Wit({
  accessToken: token,
  actions,
  logger: new log.Logger(log.INFO)
});

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/users', users);

require('./config/passport')(passport);

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

app.get('/', (req,res) => {
	res.setHeader('content-type', 'application/json');
  res.json({status: "ok", message: "you are in the root route"});
});

app.get('/test', (req,res) => {
	res.setHeader('content-type', 'application/json');
	res.json({status: "ok", message: "you are in the test route"});
});

app.post('/chat', (req, res) => {
	res.setHeader('content-type', 'application/json');
	let message = req.body.message;
  let maxSteps = 10;
  let context = typeof initContext === 'object' ? initContext : {};
  const sessionId = uuid.v1();

  const steps = maxSteps ? maxSteps : DEFAULT_MAX_STEPS;
  
  wit.runActions(sessionId, message, context, steps)
 .then((ctx) => {
    context = ctx;
    res.json(context);
  })
  .catch(err => console.error(err));
});

app.listen(3000, () => {
	console.log("Chat Bot started!");
});