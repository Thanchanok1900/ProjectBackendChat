require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log, 
  }
);

async function connect() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

async function sync() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully.");
  } catch (error) {
    console.error('Unable to sync the database:', error);
  }
}

module.exports = { sequelize, connect, sync };
