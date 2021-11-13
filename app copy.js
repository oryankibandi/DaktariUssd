require('dotenv').config()
const log = require('signale')

const { Elarian } = require('elarian')
const { await } = require('signale')

// Create a connection

const api_key = process.env.APIKEY
const app_id = process.env.APPID
const org_id = process.env.ORGID

let client

async function sendResults(customer, num) {
    let smsChannel = {
        channel: 'sms',
        number: '20775'
    }
    let telegramChannel = {
        channel: 'telegram',
        number: 'kibandi'
    }
    const patient = new client.Customer({
        number: num,
        provider: 'cellular'
    })
    await patient.sendMessage(
        smsChannel,
        { body: { text: 'Thank you for your enquiry, we will get back to you on the with your results' } }
    ).catch((error) => {
        console.log(error.message)
        console.log('message not sent......')
    })
}

const handleUssd = async  (notification, customer, appData, callback) => {

    try {
        const input = notification.input.text

        // Handlers
        let screen = 'home'
        if (appData) {
            screen = appData.screen
        }

        const customerData = await customer.getMetadata();
        let {
            name
        } = customerData;
        const menu = {
            text: null,
            isTerminal: false,
        };

        let nextscreen = screen

        if (screen === 'home' && input === '') {
            if (name) {
                nextScreen = 'schedule';
            }
        }
        if (screen === 'home' && input !== '') {
            if (input === '1') {
                nextScreen = 'request-name';
            } else if (input === '2') {
                nextScreen = 'quit';
            }
        }

        switch (nextscreen) {
            case 'request-name':
                menu.text = 'Alright, what is your name?';
                nextScreen = 'request-amount';
                callback(menu, {
                    screen: nextScreen,
                });
                break;
            case 'schedule':
                menu.text = 'Alright, what day would you like to schedule';
                nextscreen = 'schedule-day';
                callback(menu, {
                    screen: nextscreen,
                });
                break;
            case 'get-results':
                menu.text = 'Enter the number to have the results sent';
                nextscreen = 'send-results';
                callback(menu, {
                    screen: nextscreen,
                });
                break;
            case 'send-results':
                let number = input
                menu.text = `Thank you,\n we will send your results on ${number}`
                menu.isTerminal = true
                nextscreen = 'home'
                callback(menu, {
                    screen: nextscreen,
                });
                await sendResults(customer, number)
                break
            case 'schedule-day':
                menu.text = 'What day would you like to schedule\n1. Monday\n2. Tuesday\n3. Wednesday\n4. Thursday\n5. Friday';
                nextscreen = 'confirm-day';
                callback(menu, {
                    screen: nextscreen,
                });
                break;
            case 'confirm-day':
                let appointment = input
                menu.text = `Thank you,\n we will get back to you on the availability of ${appointment}`
                menu.isTerminal = true
                nextscreen = 'home'
                callback(menu, { screen: nextscreen })
                break
            case 'quit':
                menu.text = 'Happy Coding!';
                menu.isTerminal = true;
                nextScreen = 'home';
                callback(menu, {
                    screen: nextScreen,
                });
                break;
            case 'home':
            default:
                menu.text = 'Welcome to Daktari!\n1. Schedule a consultation\n2. Quit';
                menu.isTerminal = false;
                callback(menu, {
                    screen: nextScreen,
                });
                break;
        }

        await customer.updateMetadata({
            name
        })

    } catch (error) {
        log.error('USSD Error: ', error);
    }

}

const start = () => {
    client = new Elarian({
        appId: app_id,
        orgId: org_id,
        apiKey: api_key
    })

    client
        .on('error', (error) => {
            log.warn(`${error.message || error}. Attemping to reconnect...`)
            client.connect()
        })
        .on('connected', () => {
            console.log('Connected to Elarian...')

            const customer = new client.Customer({
                provider: 'cellular',
                number: '+254701724629'
            })

            const resp = customer.sendMessage(
                { channel: 'sms', number: '23454' },
                {
                    body: {
                        text: 'Kwani ni kesho?'
                    }
                }
            )
        })
        .on('ussdSession', handleUssd)
        .connect()
}

start()