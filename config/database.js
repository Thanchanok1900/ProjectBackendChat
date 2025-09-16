const { Sequelize } = require('sequelize'); 

const sequelize = new Sequelize(
  'DatabaseTranslateChat', 
  'postgres',
  'Rsv19390', 
  {
    host: 'localhost', 
    dialect: 'postgres'
  }
);

async function connect() {
    try{
        await sequelize.authenticate();
        console.log('Database connected successfully.');
    }catch(error){
        console.error('Unable to connect to the database:', error);
    }
}

async function sync() {
    try{
        await sequelize.sync({ alter: true });
        console.log("Database synced successfully.");
    }catch(error){
        console.error('Unable to sync the database:', error);
    }
}

module.exports = {sequelize, connect, sync};
