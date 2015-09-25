define(['Chat', 'ChatUI', 'ChatMessage'], function (Chat, ChatUI, ChatMessage) {
  'use strict';

  // This regular expression detect text fragments looking like URLs.
  var links = /https?\:\/\/[^.]+\..+/g;

  // The `ChatWidget` class combines the `ChatUI` and `ChatMessage` UI classes
  // plus the `Chat` library to provide a functional Chat widget.
  function ChatWidget(options) {
    options = options || {};
    this._chatBox = new ChatUI(options);

    // Overriding the `ChatUI#renderMessage()` function you can transform
    // the contents of a message before showing them into the conversation.
    this._chatBox.renderMessage = this.renderMessage.bind(this);

    // By delaying starting the chat we allow the UI to be early attached to
    // the DOM. When session is ready, `ChatWidget#start()` can be called to
    // connect to the chat session.
    if (options.session) {
      this.start(options);
    }
    this._chatBox.disableSending();
  }

  ChatWidget.prototype = {
    constructor: ChatWidget,

    // Connect the chat to the session provided in the `options` object. The
    // object is passed to the `Chat` library so you can configure the instance
    // in the same object.
    start: function (options) {
      if (!this._chat) {
        this._chat = new Chat(options);

        // Received messages are handled by the library...
        this._chat.onMessageReceived = this.onMessageReceived.bind(this);

        // ...while sending messages is something controlled by the UI.
        this._chatBox.onMessageReadyToSend =
          this.onMessageReadyToSend.bind(this);

        // This set the sender information, their id to group messages and their
        // alias to show to other users.
        this._chatBox.senderId = options.session.connection.connectionId;
        this._chatBox.senderAlias = options.session.connection.data;

        // Finally, enable message area and send buttons.
        this._chatBox.enableSending();
      }
    },

    // After the user click on the send button, simply send the contents through
    // the `Chat` instance.
    onMessageReadyToSend: function (contents, callback) {
      this._chat.send(contents, callback);
    },

    // After a message is received, simply create a new `ChatMessage` instance
    // and add it to the UI.
    onMessageReceived: function (contents, from) {
      var message = new ChatMessage(from.connectionId, from.data, contents);
      this._chatBox.addMessage(message);
    },

    // Transformations implemented by the default widget include detecting URLs
    // and allowing multiline messages.
    renderMessage: function (raw) {
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

  return ChatWidget;
});
