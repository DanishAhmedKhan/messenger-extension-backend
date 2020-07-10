require('@babel/register')({
  presets: ['@babel/preset-env'],
});
require('babel-polyfill');
const app = require('./app');

// listenig our app
app.listen(process.env.APP_PORT || 3000, () => {
  console.log('-------------------------START----------------------------');
  console.log(`Process ${process.pid} is listening to all incoming requests on ${process.env.APP_PORT}`);
});
