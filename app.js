import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoose from 'mongoose';
import cors from 'cors';
import ip from 'ip';
import userApi from './api/user';


dotenv.config();
const app = express();

const { userAuthToken } = process.env;
const appMode = process.env.APP_MODE;
const dbUrl = process.env.DB_URL;

if (userAuthToken === null) {
  console.log('FATAL ERROR: One or more auth token not set');
  process.exit(1);
}

const ipAddress = ip.address();
console.log(`Trying to start Messenger Extension server at ${ipAddress} (in ${appMode} mode)...`);


app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

if (appMode === 'development') {
  app.use(morgan('tiny'));
}

if (appMode === 'production') {
  app.use(morgan('tiny'));
  app.use(helmet());
}

app.use('/test', async (req, res) => {
  console.log('Server running properly!');
  res.status(200).send('Server running properly');
});


app.use('/api/user', userApi);

// Image static routing
app.use(express.static(`${__dirname}/public`));

// connecting to the mongoDB Atlas cloud storage
console.log(`Trying to connect to mongodb ${dbUrl}`);

const mongoDbConfig = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
};

mongoose.connect(dbUrl, mongoDbConfig)
  .then(() => console.log('Connected to mongodb.'))
  .catch(err => console.log('Could not connect to mongodb.', err));

module.exports = app;
