
define([], function () {
  'use strict';

  function ChatUIMock() { this._constructor.apply(this, arguments); }
  ChatUIMock.prototype._constructor = sinon.spy();
  ChatUIMock.prototype.disableSending = function () {};

  function ChatMessageMock() {}

  return {
    ChatUI: ChatUIMock,
    ChatMessage: ChatMessageMock
  };
});
