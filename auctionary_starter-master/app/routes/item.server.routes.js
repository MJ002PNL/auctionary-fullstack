const itemController = require('../controllers/item.server.controller');

module.exports = (app) => {
  console.log('item.server.routes.js loaded');
  app.post('/item', itemController.createItem);   
  app.post('/items', itemController.createItem);  

  app.get('/item/:item_id', itemController.getItem);   
  app.get('/items/:item_id', itemController.getItem);  

  app.post('/item/:item_id/bid', itemController.addBid);   
  app.get('/item/:item_id/bid', itemController.getBids);   
  app.post('/items/:item_id/bid', itemController.addBid);  
  app.get('/items/:item_id/bid', itemController.getBids);  
  app.post('/items/:item_id/bids', itemController.addBid);
  app.get('/items/:item_id/bids', itemController.getBids);

  app.post('/item/:item_id/question', itemController.askQuestion); 
  app.get('/item/:item_id/question', itemController.getQuestions);   
  app.post('/items/:item_id/questions', itemController.askQuestion);
  app.get('/items/:item_id/questions', itemController.getQuestions);

  app.post('/question/:question_id', itemController.answerQuestion);
  app.post('/questions/:question_id/answer', itemController.answerQuestion);
  
  app.get('/search', itemController.searchItems);
};
