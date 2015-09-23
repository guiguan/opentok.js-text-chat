'use strict';

function Chat(options) {
  if (!options || !options.session) { throw new Error('No session provided.'); }
  this._session = options.session;

  var signalName = options.signalName || 'chat';
  this._session.on('signal:' + signalName, this._handleChatSignal.bind(this));
  Object.defineProperty(this, 'signalName', { value: signalName });
}

Chat.prototype = {
  constructor: Chat,

  send: function (text, callback) {
    var signal = this._getMessageSignal(text);
    this._session.signal(signal, callback);
  },

  onMessageReceived: function (type, callback) { callback(); },

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

export default Chat;
