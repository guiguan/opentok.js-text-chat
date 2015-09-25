define([], function () {
  'use strict';

  function ChatMessage(senderId, senderAlias, text) {
    Object.defineProperties(this, {
      senderId: { value: senderId },
      senderAlias: { value: senderAlias },
      text: { value: text },
      dateTime: { value: new Date() }
    });
  }

  return ChatMessage;
});
