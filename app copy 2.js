require('dotenv').config(); // load configs from .env

const log = require('signale');

const { Elarian } = require('elarian');

let client;

const processUssd = async (notification, customer, appData, callback) => {
  try {
    log.info(`Processing USSD from ${customer.customerNumber.number}`);
    const input = notification.input.text;

    let screen = 'home';
    if (appData) {
      screen = appData.screen;
    }

    const customerData = await customer.getMetadata();
    let { name } = customerData;
    const menu = {
      text: null,
      isTerminal: false,
    };
    let nextScreen = screen;
    if (screen === 'home' && input !== '') {
      if (input === '1') {
        nextScreen = 'request-name';
      } else if (input === '2') {
        nextScreen = 'quit';
      }
    }
    if (screen === 'home' && input === '') {
      if (name) {
        nextScreen = 'schedule-day';
      }
    }
    switch (nextScreen) {
      case 'request-name':
        menu.text = 'Alright, what is your name?';
        nextScreen = 'schedule-day';
        callback(menu, {
          screen: nextScreen,
        });
        break;
      case 'schedule-day':
        name = input;
        menu.text = `What day would you like to schedule ${name}\n1. Monday\n2. Tuesday\n3. Wednesday\n4. Thursday\n5. Friday`;
        nextscreen = 'confirm-day';
        callback(menu, {
          screen: nextscreen,
        });
        break;
      case 'confirm-day':
        let appointment = input;
        menu.text = `Thank you,\n we will get back to you on the availability of ${appointment}`;
        menu.isTerminal = true;
        nextscreen = 'home';
        callback(menu, { screen: nextscreen });
        break;
      case 'quit':
        menu.text = 'Happy Coding!';
        menu.isTerminal = true;
        nextScreen = 'home';
        callback(menu, {
          screen: nextScreen,
        });
        break;
      //   case 'info':
      //     menu.text = `Hey ${name}, `;
      //     menu.text +=
      //       balance > 0
      //         ? `you still owe me KES ${balance}!`
      //         : 'you have repaid your loan, good for you!';
      //     menu.isTerminal = true;
      //     nextScreen = 'home';
      //     callback(menu, {
      //       screen: nextScreen,
      //     });
      //     break;
      //   case 'request-amount':
      //     name = input;
      //     menu.text = `Okay ${name}, how much do you need?`;
      //     nextScreen = 'approve-amount';
      //     callback(menu, {
      //       screen: nextScreen,
      //     });
      //     break;
      //   case 'approve-amount':
      //     balance = parseInt(input, 10);
      //     menu.text = `Awesome! ${name} we are reviewing your application and will be in touch shortly!\nHave a lovely day!`;
      //     menu.isTerminal = true;
      //     nextScreen = 'home';
      //     callback(menu, {
      //       screen: nextScreen,
      //     });
      //     await approveLoan(customer, balance);
      //     break;
      //   case 'home':
      default:
        menu.text = 'Welcome to Daktari!\n1. Schedule a consultation\n2. Quit';
        menu.isTerminal = false;
        callback(menu, {
          screen: nextScreen,
        });
        break;
    }
    await customer.updateMetadata({
      name,
    });
  } catch (error) {
    log.error('USSD Error: ', error);
  }
};

const start = () => {
  client = new Elarian({
    appId: process.env.APP_ID,
    orgId: process.env.ORG_ID,
    apiKey: process.env.API_KEY,
  });

  client.on('ussdSession', processUssd);

  client
    .on('error', (error) => {
      log.warn(`${error.message || error} Attempting to reconnect...`);
      client.connect();
    })
    .on('connected', () => {
      log.success(
        `App is connected, waiting for customers on ${process.env.USSD_CODE}`
      );
    })
    .connect();
};
start();
