const userController = require('../controllers/user.server.controller');

module.exports = (app) => {
  console.log('user.server.routes.js loaded');

  app.post('/users', userController.registerUser);
  app.post('/login', userController.loginUser);
  app.post('/logout', userController.logoutUser);
  app.get('/users/:user_id', userController.getUserById);
};
