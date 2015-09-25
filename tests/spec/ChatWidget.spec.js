
define([
  'tests/mocks/ChatUIMock'
], function (ChatUIMock) {
  'use strict';

  var ChatWidget;

  var ChatMock = function () {};

  var context = newContext({
    'Chat': ChatMock,
    'ChatUI': ChatUIMock,
    'ChatMessage': function () {}
  });

  describe('The ChatWidget class', function () {

    beforeEach(function (done) {
      context(['base/src/ChatWidget.js'], function (module) {
        ChatWidget = module;
        done();
      });
      ChatUIMock.prototype._constructor.reset();
    });

    it('creates a UI for the widget', function () {
      var widget = new ChatWidget({ session: { once: function () {} }});
      expect(ChatUIMock.prototype._constructor.called).to.be.true;
    });
  });

});
