define([], function () {
  'use strict';

  /**
   * A convinient representation of a chat message.
   *
   * @class ChatMessage
   * @constructor
   * @param {String} senderId A unique id to identify the origin of the message.
   * @param {String} senderAlias A name to be displayed as the author of the
   * message.
   * @param {String} text The contents of the message.
   */
  function ChatMessage(senderId, senderAlias, text) {
    Object.defineProperties(this, {

      /**
       * A unique id to identify the origin of the message.
       *
       * @property senderId
       * @type String
       * @readOnly
       */
      senderId: { value: senderId },

      /**
       * A name to be displayed as the author of the message.
       *
       * @property senderAlias
       * @type String
       * @readOnly
       */
      senderAlias: { value: senderAlias },

      /**
       * The contents of the message.
       *
       * @property text
       * @type String
       * @readOnly
       */
      text: { value: text },

      /**
       * The moment the message was created at.
       *
       * @property senderId
       * @type Date
       * @readOnly
       */
      dateTime: { value: new Date() }
    });
  }

  return ChatMessage;
});
