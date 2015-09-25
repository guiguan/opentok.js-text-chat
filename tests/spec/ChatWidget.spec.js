
define([
  'tests/mocks/ChatUIMock'
], function (ChatUIMock) {
  'use strict';

  var ChatWidget;

  var ChatMock = function () {};

  var context = newContext({
    'Chat': ChatMock,
    'ChatUI': ChatUIMock
  });

  describe('The ChatWidget class', function () {

    beforeEach(function (done) {
      context(['base/src/ChatWidget.js'], function (module) {
        ChatWidget = module;
        done();
      });
      ChatUIMock.ChatUI.prototype._constructor.reset();
    });

    it('creates a UI for the widget', function () {
      var widget = new ChatWidget();
      expect(ChatUIMock.ChatUI.prototype._constructor.called).to.be.true;
    });
  });

});
