const Joi = require('joi');

const successResponse = (req, res, data, code = 200) => res.send({
  code,
  data,
  status: true,
});

const errorResponse = (
  req,
  res,
  errorMessage = 'Something went wrong',
  code = 500,
  error = {},
) => res.status(code).json({
  code,
  errorMessage,
  error,
  data: null,
  status: false,
});

const error = msg => ({
  status: 'error',
  msg,
});

const success = data => ({
  status: 'success',
  data,
});

const validate = (data, schemaObject) => {
  const schema = Joi.object().keys(schemaObject);

  const { error } = Joi.validate(data, schema, {
    abortEarly: true,
    convert: true,
    allowUnknown: true,
  });

  return error;
};

const getCurrentDateTime = () => {
  const dateTime = new Date();

  const year = dateTime.getFullYear();
  const month = dateTime.getMonth();
  const day = dateTime.getDate();
  const hour = dateTime.getHours();
  const minute = dateTime.getMinutes();
  const second = dateTime.getSeconds();
  const timestamp = dateTime.getTime();

  const currentDateTime = {
    year, month, day, hour, minute, second, timestamp,
  };
  return currentDateTime;
};

const getCurrentDate = () => {
  const dateTime = new Date();

  const year = dateTime.getFullYear();
  const month = dateTime.getMonth();
  const day = dateTime.getDate();

  const currentTime = {
    year,
    month,
    day,
    hour: null,
    minute: null,
    second: null,
  };
  return currentTime;
};

const toStringDate = date => `${date.year}-${date.month}-${date.day}`;

const getNextDay = (currentDay) => {
  const currentDate = new Date(
    currentDay.year,
    currentDay.month,
    currentDay.day,
  );
  const nextDayDate = new Date();
  nextDayDate.setDate(currentDate.getDate() + 1);

  return nextDayDate;
};

const isToday = date => _.isEqual(getCurrentDate, date);

const generateRandom = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = {
  successResponse,
  errorResponse,
  error,
  success,
  validate,
  getCurrentDateTime,
  toStringDate,
  getCurrentDate,
  getNextDay,
  isToday,
  generateRandom,
};
