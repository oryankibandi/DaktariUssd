require('dotenv').config()
const log = require('signale')

const { Elarian } = require('elarian')
const { await } = require('signale')

// Create a connection

const api_key = process.env.APIKEY
const app_id = process.env.APPID
const org_id = process.env.ORGID

let client

// Handlers
let screen = 'home'
let nextscreen = screen

async function sendResults(customer, num){
let smsChannel = {
    channel:'sms',
    number: '20775'
}
let telegramChannel = {
    channel:'telegram',
    number: 'kibandi'
}
console.log('creating new customer....')
const patient = new client.Customer({
    number:num,
    provider:'cellular'
})
console.log('sending message......')
await patient.sendMessage(
    smsChannel,
        {body:{text: 'Thank you for your enquiry, we will get back to you on the with your results'}}
).catch((error)=>{
    console.log(error.message)
    console.log('message not sent......')
})
}

async function handleUssd(notification, customer, appData, callback) {
    console.log(notification)

    const customerData = await customer.getState()

    const input = notification.input.text

    const menu = {
        text: '',
        isTerminal: false
    }
    
    if (screen === 'home' && input === '') {
        menu.text = 'Hi there, welcome to the Daktari\n'
        menu.text += 'What would you like to do?\n'
        menu.text += '1. Schedule a consultation\n2. check lab results'

        callback(menu, appData)

    }
    if(screen === 'home' && input !== ''){
        if(input === '1'){
            nextscreen='schedule-day'
        }else if(input === '2'){
            nextscreen = 'get-results'
        }
    }

    switch (nextscreen){
        case 'schedule':
            console.log('case>> schedule')
            menu.text = 'Alright, what day would you like to schedule';
            nextscreen = 'schedule-day';
            callback(menu, {
                screen: nextscreen,
            });
            break;
        case 'get-results':
            console.log('case>> get results')
            menu.text = 'Enter the number to have the results sent';
            nextscreen = 'send-results';
            callback(menu, {
                screen: nextscreen,
            });
            break;
        case 'send-results':
            console.log('case>> send results')
            let number = input
            menu.text = `Thank you,\n we will sennd your results on ${number}`
            menu.isTerminal = true
            nextscreen='home'
            callback(menu, {
                screen: nextscreen,
            });
            await sendResults(customer,number)
            break
        case 'schedule-day':
            console.log('case>> schedule day')
            menu.text = 'What day would you like to schedule\n1. Monday\n2. Tuesday\n3. Wednesday\n4. Thursday\n5. Friday';
            nextscreen = 'confirm-day';
            callback(menu, {
                screen: nextscreen,
            });
            break;
        case 'confirm-day':
            console.log('case>> confirm day')
            let appointment = input
            console.log('getting day.....')
            console.log(appointment)
            menu.text = `Thank you,\n we will get back to you on the availability of ${appointment}`
            console.log('day gotten')
            menu.isTerminal = true
            nextscreen='home'
            callback(menu, {screen: nextscreen})
            break
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
            log.warn(`${ error.message || error }. Attemping to reconnect...`)
            client.connect()
        })
        .on('connected', () => {
            console.log('Connected to Elarian...')

            const customer = new client.Customer({
                provider: 'cellular',
                number: '+254701724629'
            })

            const resp = customer.sendMessage(
                {channel: 'sms', number: '23454'},
                {
                    body: {
                        text: 'Kwani ni kesho?'
                    }
                }
            )

            console.log(resp)
        })
        .on('ussdSession', handleUssd)
        .connect()
}

start()