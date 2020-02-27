const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose');
const config = require('config');
const cors = require('cors');
const ip = require('ip');
const https = require('https');

const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

const app = express();

const userAuthToken = config.get('userAuthToken');
if (userAuthToken == null) {
    console.log('FATAL ERROR: One or more auth token not set');
    process.exit(1);
}

const env = app.get('env');
const ipAddress = ip.address();
console.log(`Trying to start Messenger Extension server at ${ipAddress} (in ${env} mode)...`);

app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

if (env == 'development') {
    app.use(morgan('tiny'));
}

if (env == 'production') {
    app.use(morgan('tiny'));
    app.use(helmet());
}

app.use('/test', async (req, res) => {
    console.log('Server running properly!');
    res.status(200).send('Server running properly');
});

const userApi = require('./api/user.js');
const playgroundApi = require('./playground/test');

app.use('/api/user', userApi);
app.use('/playground', playgroundApi);

// Image static routing
app.use(express.static(__dirname + '/public'));

// connecting to the mongoDB Atlas cloud storage
const dbUrl = config.get('db');
console.log(`Trying to connect to mongodb ${dbUrl}`);

const mongoDbConfig = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
};

mongoose.connect(dbUrl,  mongoDbConfig)
    .then(() => console.log('Connected to mongodb.'))
    .catch(err => console.log('Could not connect to mongodb.', err));

// starting the server
const port = process.env.PORT || config.get('server.port');
// https.createServer({
//     key: fs.readFileSync('key.pem'),
//     cert: fs.readFileSync('cert.pem')
// }, app).listen(port, () => {
//     console.log(`Listining to port ${post}`);
// });
app.listen(port, () => {
    console.log(`Listining to port ${port}`);
});