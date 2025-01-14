// Import required libraries
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const aws = require('aws-iot-device-sdk')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// Configure AWS IoT
const device = aws.device({
    keyPath: './certs/private.pem.key',
    certPath: './certs/certificate.pem.crt',
    caPath: './certs/root-CA.crt',
    clientId: 'my_thing',
    host: process.env.AWS_IOT_ENDPOINT
})

// Configure Serial Port
const port = new SerialPort({
    path: process.env.SERIAL_PORT,  // Change according to your system
    baudRate: 9600
})

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

// Handle Serial Port events
port.on('open', () => {
    console.log('Serial port opened')
})

port.on('error', (err) => {
    console.error('Serial port error:', err)
})

// Handle AWS IoT connection events
device.on('connect', () => {
    console.log('Connected to AWS IoT')
})

device.on('error', (err) => {
    console.error('AWS IoT error:', err)
})

// Parse and publish data
parser.on('data', (data) => {
    try {
        // Parse data format "T:24.13,pH:2.27"
        const values = data.split(',');
        const temperature = parseFloat(values[0].split(':')[1]);
        const pH = parseFloat(values[1].split(':')[1]);
        
        const message = {
            device_id: 'arduino_001',
            temperature: temperature,
            pH: pH,
            gateway_id: 'gateway_001',
            timestamp: new Date().toISOString()
        }

        device.publish('sensors/data', JSON.stringify(message));
        console.log('Published:', message);
    } catch (err) {
        console.error('Error processing data:', err);
    }
});