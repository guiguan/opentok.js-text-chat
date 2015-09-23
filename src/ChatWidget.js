'use strict';

import Chat from './Chat';
import { ChatUI, ChatMessage } from './ChatUI';

var links = /https?\:\/\/[^.]+\..+/g;

function ChatWidget(options) {
  options = options || {};
  this._chatBox = new ChatUI(options);
  this._chatBox.render = this.render.bind(this);
  this._chatBox.disableSending();
  if (options.session) {
    this.start(options);
  }
}

ChatWidget.prototype = {
  constructor: ChatWidget,

  start: function (options) {
    if (!this._chat) {
      this._chat = new Chat(options);
      this._chat.onMessageReceived = this.onMessageReceived.bind(this);
      this._chatBox.senderId = options.session.connection.connectionId;
      this._chatBox.senderAlias = options.session.connection.data;
      this._chatBox.onMessageReadyToSend = this.onMessageReadyToSend.bind(this);
      this._chatBox.enableSending();
    }
  },

  onMessageReadyToSend: function (contents, callback) {
    this._chat.send(contents, callback);
  },

  onMessageReceived: function (contents, from) {
    var message = new ChatMessage(from.connectionId, from.data, contents);
    this._chatBox.addMessage(message);
  },

  render: function (raw) {
    var output;

    // Allow multiline
    output = raw.replace(/(\r\n|\r|\n)/g, '<br/>');

    // Detect links
    output = output.replace(links, function (href) {
      return '<a href="' + href + '" target="_blank">' + href + '</a>';
    });

    return output;
  }
};

export default ChatWidget;
