define(['Chat', 'ChatUI', 'ChatMessage'], function (Chat, ChatUI, ChatMessage) {
  'use strict';

  // This regular expression detect text fragments looking like URLs.
  var links = /https?\:\/\/[^.]+\..+/g;

  /**
   * An HTML widget enabling basic chat capabilities. Pass a `session` object
   * to the `options` hash. It's not mandatory for the session to be connected
   * but the chat won't allow the user until the session is connected.
   *
   * @class ChatWidget
   * @constructor
   * @param {Object} options A hash with the union of the options for
   * {{#crossLink "Chat"}}{{/crossLink}} and
   * {{#crossLink "ChatUI"}}{{/crossLink}} constructors to customize several
   * aspects of the chat behaviour and internals.
   */

  // The `ChatWidget` class combines the `ChatUI` and `ChatMessage` UI classes
  // plus the `Chat` library to provide a functional Chat widget.
  function ChatWidget(options) {
    if (!options || !options.session) {
      throw new Error(
        'The key session must be present and set to a valid OpenTok session.'
      );
    }

    this._chatBox = new ChatUI(options);

    // Overriding the `ChatUI#renderMessage()` function you can transform
    // the contents of a message before showing them into the conversation.
    this._chatBox.renderMessage = this.renderMessage.bind(this);

    // If the session is connected, create the chat session...
    if (options.session.connection) {
      this._start(options);
    }
    // ...if not, simply wait for the session to be connected, then create
    // the chat session.
    else {
      options.session.once(
        'sessionConnected',
        this._start.bind(this, options)
      );
    }
    this._chatBox.disableSending();
  }

  ChatWidget.prototype = {
    constructor: ChatWidget,

    // Connect the chat to the session provided in the `options` object.
    _start: function (options) {
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


    /**
     * Called when the user clicks on the send button. It will received the
     * contents from the input area and a callback to call once it finishes to
     * send the message and it can be displayed in the conversation area.
     *
     * @method onMessageReadyToSend
     * @param {String} contents Contents of the input area at the moment the
     * user clicked on the send button.
     * @param {Function} callback Function to call once the message is ready
     * to be displayed in the conversation area (usually after it was
     * successfully sent). Pass no parameters to denote success and some
     * error to indicate a failure.
     */

    // After the user click on the send button, simply send the contents through
    // the `Chat` instance.
    onMessageReadyToSend: function (contents, callback) {
      this._chat.send(contents, callback);
    },


    /**
     * Called when the chat receives a message. It extracts the proper id and
     * alias from the connection representing the participant that sent the
     * message and add it to the conversation.
     *
     * @method onMessageReceived
     * @param {String} contents The very same raw contents received through
     * the chat.
     * @param {Connection} from The OpenTok connection object representing
     * the participant sending the message.
     */

    // After a message is received, simply create a new `ChatMessage` instance
    // and add it to the UI.
    onMessageReceived: function (contents, from) {
      var message = new ChatMessage(from.connectionId, from.data, contents);
      this._chatBox.addMessage(message);
    },

    /**
     * Transform the text from the message into the actual content to be
     * displayed. This case allow multiline messages and recognize urls.
     *
     * @method renderMessage
     * @param {String} raw The original message contents.
     */

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
