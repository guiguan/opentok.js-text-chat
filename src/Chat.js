define([], function () {
  'use strict';

  /**
   * OpenTok signal based Chat client.
   *
   * @class Chat
   * @constructor
   * @param {Object} options Hash with configuration options.
   * @param {Session} options.session OpenTok connected session for the chat.
   * @param {String} [options.signalName='TextChat'] The name for the signal to
   * be used to transport messages. Leave as it is to ensure compatibility with
   * the iOS and Android components or change to provide your own.
   */
  function Chat(options) {
    if (!options || !options.session) {
      throw new Error('No session provided.');
    }
    this._session = options.session;

    var signalName = options.signalName || 'TextChat';
    this._session.on('signal:' + signalName, this._handleChatSignal.bind(this));
    Object.defineProperty(this, 'signalName', { value: signalName });
  }

  Chat.prototype = {
    constructor: Chat,

    /**
     * Sends a message though the chat.
     *
     * @method send
     * @param {String} text Contents of the message.
     * @param {Function} callback Called once the signal has been sent. If there
     * is an error while sending, the callback is passed the error as first
     * parameter.
     * @async
     */
    send: function (text, callback) {
      var signal = this._getMessageSignal(text);
      this._session.signal(signal, callback);
    },

    /**
     * Called when receiving a new message from the chat.
     *
     * @method onMessageReceived
     * @param {String} contents The contents from the received message.
     * @param {Connection} from OpenTok `Connection` representing the
     * participant sending the message.
     */
    onMessageReceived: function (contents, from) {},

    _handleChatSignal: function (signal) {
      var me = this._session.connection.connectionId;
      var from = signal.from.connectionId;
      if (from !== me) {
        var handler = this.onMessageReceived;
        if (handler && typeof handler === 'function') {
          handler(signal.data, signal.from);
        }
      }
    },

    _getMessageSignal: function (text) {
      return {
        type: this.signalName,
        data: text
      };
    }
  };

  return Chat;
});
