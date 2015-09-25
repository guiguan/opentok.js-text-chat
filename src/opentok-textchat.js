define([
  './Chat',
  './ChatUI',
  './ChatWidget'
], function (Chat, ChatUIPackage, ChatWidget) {

  var ChatUI = ChatUIPackage.ChatUI;
  var ChatMessage = ChatUIPackage.ChatMessage;

  window.OT.TextChat = {
    Chat: Chat,
    ChatUI: ChatUI,
    ChatMessage: ChatMessage,
    ChatWidget: ChatWidget
  };

});
