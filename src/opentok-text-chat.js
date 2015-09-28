define([
  'Chat',
  'ChatUI',
  'ChatMessage',
  'ChatWidget'
], function (Chat, ChatUI, ChatMessage, ChatWidget) {

  window.OTSolution = window.OTSolution || {};

  window.OTSolution.TextChat = {
    Chat: Chat,
    ChatUI: ChatUI,
    ChatMessage: ChatMessage,
    ChatWidget: ChatWidget
  };

});
