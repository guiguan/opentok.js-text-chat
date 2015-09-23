(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function Chat(options) {
  if (!options || !options.session) {
    throw new Error('No session provided.');
  }
  this._session = options.session;

  var signalName = options.signalName || 'chat';
  this._session.on('signal:' + signalName, this._handleChatSignal.bind(this));
  Object.defineProperty(this, 'signalName', { value: signalName });
}

Chat.prototype = {
  constructor: Chat,

  send: function send(text, callback) {
    var signal = this._getMessageSignal(text);
    this._session.signal(signal, callback);
  },

  onMessageReceived: function onMessageReceived(type, callback) {
    callback();
  },

  _handleChatSignal: function _handleChatSignal(signal) {
    var me = this._session.connection.connectionId;
    var from = signal.from.connectionId;
    if (from !== me) {
      var handler = this.onMessageReceived;
      if (handler && typeof handler === 'function') {
        handler(signal.data, signal.from);
      }
    }
  },

  _getMessageSignal: function _getMessageSignal(text) {
    return {
      type: this.signalName,
      data: text
    };
  }
};

exports['default'] = Chat;
module.exports = exports['default'];

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var uiLayout = ['<div class="ot-bubbles">', '</div>', '<div class="ot-input">', '  <div>', '    <p class="ot-error-zone" hidden>Error sending the message!</p>', '    <p class="ot-new-messages" hidden>▾&nbsp;New messages</p>', '    <textarea placeholder="Send a message&hellip;" class="ot-composer">' + '</textarea>', '    <div class="ot-bottom-line">', '      <p class="ot-character-counter"><span></span> characters left</p>', '      <button class="ot-send-button">Send&nbsp;⟩</button>', '    </div>', '  </div>', '</div>'].join('\n');

var bubbleLayout = ['<div>', '  <header class="ot-bubble-header">', '    <p class="ot-message-sender"></p>', '    <time class="ot-message-timestamp"></time>', '  </header>', '</div>'].join('\n');

function ChatUI(options) {
  options = options || {};
  this.senderId = options.senderId || ('' + Math.random()).substr(2);
  this.senderAlias = options.senderAlias || 'me';
  this.maxTextLength = options.maxTextLength || 1000;
  this.groupDelay = options.groupDelay || 2 * 60 * 1000; // 2 min
  this.timeout = options.timeout || 5000;
  this._watchScrollAtTheBottom = this._watchScrollAtTheBottom.bind(this);
  this._messages = [];
  this._setupTemplates();
  this._setupUI(options.container);
  this._updateCharCounter();
}

ChatUI.prototype = Object.defineProperties({
  constructor: ChatUI,

  _setupTemplates: function _setupTemplates() {
    this._bubbleTemplate = document.createElement('section');
    this._bubbleTemplate.innerHTML = bubbleLayout;
    this._bubbleTemplate.classList.add('ot-bubble');
  },

  _setupUI: function _setupUI(parent) {
    parent = document.querySelector(parent) || document.body;

    var chatView = document.createElement('section');
    chatView.innerHTML = uiLayout;
    chatView.classList.add('ot-textchat');

    var sendButton = chatView.querySelector('.ot-send-button');
    var composer = chatView.querySelector('.ot-composer');
    var charCounter = chatView.querySelector('.ot-character-counter > span');
    var errorZone = chatView.querySelector('.ot-error-zone');
    var newMessages = chatView.querySelector('.ot-new-messages');

    this._composer = composer;
    this._sendButton = sendButton;
    this._charCounter = charCounter;
    this._bubbles = chatView.firstElementChild;
    this._errorZone = errorZone;
    this._newMessages = newMessages;

    // XXX: It's already bound in the constructor
    this._bubbles.onscroll = this._watchScrollAtTheBottom;
    this._sendButton.onclick = this._sendMessage.bind(this);
    this._composer.onkeyup = this._updateCharCounter.bind(this);
    this._composer.onkeydown = this._controlComposerInput.bind(this);
    this._newMessages.onclick = this._goToNewMessages.bind(this);

    parent.appendChild(chatView);
  },

  _watchScrollAtTheBottom: function _watchScrollAtTheBottom() {
    if (this._isAtBottom()) {
      this._hideNewMessageAlert();
    }
  },

  _sendMessage: function _sendMessage() {
    var _this = this;
    var contents = this._composer.value;

    if (contents.length > _this.maxTextLength) {
      _this._showTooLongTextError();
    } else {
      _this._hideErrors();
      if (typeof _this.onMessageReadyToSend === 'function') {
        _this.disableSending();

        var timeout = setTimeout(function () {
          _this._showError();
          _this.enableSending();
        }, _this.timeout);

        var sent = _this.onMessageReadyToSend(contents, function (err) {
          clearTimeout(timeout);
          if (err) {
            _this._showError();
          } else {
            _this.addMessage(new ChatMessage(_this.senderId, _this.senderAlias, contents));
            _this._composer.value = '';
            _this._updateCharCounter();
            _this._hideErrors();
          }
          _this.enableSending();
        });
      }
    }
  },

  _showTooLongTextError: function _showTooLongTextError() {
    this._charCounter.parentElement.classList.add('error');
  },

  _hideTooLongTextError: function _hideTooLongTextError() {
    this._charCounter.parentElement.classList.remove('error');
  },

  _showNewMessageAlert: function _showNewMessageAlert() {
    this._newMessages.removeAttribute('hidden');
  },

  _hideNewMessageAlert: function _hideNewMessageAlert() {
    this._newMessages.hidden = true;
  },

  _showError: function _showError() {
    this._errorZone.hidden = false;
  },

  _hideErrors: function _hideErrors() {
    this._errorZone.hidden = true;
    this._hideTooLongTextError();
  },

  _showError: function _showError() {
    this._errorZone.hidden = false;
  },

  _controlComposerInput: function _controlComposerInput(evt) {
    var isEnter = evt.which === 13 || evt.keyCode === 13;
    if (!evt.shiftKey && isEnter) {
      evt.preventDefault();
      this._sendMessage();
    }
  },

  _goToNewMessages: function _goToNewMessages() {
    this._scrollToBottom();
    this._hideNewMessageAlert();
  },

  _updateCharCounter: function _updateCharCounter() {
    var remaining = this.maxTextLength - this._composer.value.length;
    var isValid = remaining >= 0;
    if (isValid) {
      this._hideTooLongTextError();
    } else {
      this._showTooLongTextError();
    }
    this._charCounter.textContent = remaining;
  },

  addMessage: function addMessage(message) {
    var shouldGroup = this._shouldGroup(message);
    var shouldScroll = this._shouldScroll();
    this[shouldGroup ? '_groupBubble' : '_addNewBubble'](message);
    if (shouldScroll) {
      this._scrollToBottom();
    } else {
      this._showNewMessageAlert();
    }
    this._messages.push(message);
  },

  renderMessage: function renderMessage(raw, isGrouping) {
    return raw;
  },

  enableSending: function enableSending() {
    this._sendButton.removeAttribute('disabled');
    this._composer.removeAttribute('disabled');
    this._composer.focus();
  },

  disableSending: function disableSending() {
    this._sendButton.disabled = true;
    this._composer.disabled = true;
  },

  _shouldGroup: function _shouldGroup(message) {
    if (this._lastMessage && this._lastMessage.senderId === message.senderId) {
      var reference = this._lastMessage.dateTime.getTime();
      var newDate = message.dateTime.getTime();
      return newDate - reference < this.groupDelay;
    }
    return false;
  },

  _shouldScroll: function _shouldScroll() {
    return this._isAtBottom();
  },

  _isAtBottom: function _isAtBottom() {
    var bubbles = this._bubbles;
    return bubbles.scrollHeight - bubbles.scrollTop === bubbles.clientHeight;
  },

  _scrollToBottom: function _scrollToBottom() {
    this._bubbles.scrollTop = this._bubbles.scrollHeight;
  },

  _groupBubble: function _groupBubble(message) {
    var contents = this.renderMessage(message.text, true);
    this._lastBubble.appendChild(this._getBubbleContent(contents));
    this._lastTimestamp.textContent = this.humanizeDate(message.dateTime);
  },

  _addNewBubble: function _addNewBubble(message) {
    this._bubbles.appendChild(this._getBubble(message));
  },

  _getBubbleContent: function _getBubbleContent(safeHtml) {
    var div = document.createElement('DIV');
    div.classList.add('ot-message-content');
    div.innerHTML = safeHtml;
    return div;
  },

  _getBubble: function _getBubble(message) {
    var bubble = this._bubbleTemplate.cloneNode(true);
    var wrapper = bubble.querySelector('div');
    var sender = wrapper.querySelector('.ot-message-sender');
    var timestamp = wrapper.querySelector('.ot-message-timestamp');

    // Sender & alias
    bubble.dataset.senderId = message.senderId;
    if (message.senderId === this.senderId) {
      bubble.classList.add('mine');
    }
    sender.textContent = message.senderAlias;

    // Content
    var contents = this.renderMessage(message.text, false);
    wrapper.appendChild(this._getBubbleContent(contents));

    // Timestamp
    timestamp.dateTime = message.dateTime.toISOString();
    timestamp.textContent = this.humanizeDate(message.dateTime);

    return bubble;
  },

  humanizeDate: function humanizeDate(date) {
    var hours = date.getHours();
    var isAM = hours < 12;
    var hours12 = hours > 12 ? hours - 12 : hours;
    var minutes = date.getMinutes();
    minutes = (minutes < 10 ? '0' : '') + minutes;
    return hours + ':' + minutes + (isAM ? ' AM' : ' PM');
  }
}, {
  _lastMessage: {
    get: function get() {
      return this._messages[this._messages.length - 1];
    },
    configurable: true,
    enumerable: true
  },
  _lastBubble: {
    get: function get() {
      return this._bubbles.lastElementChild.querySelector('div');
    },
    configurable: true,
    enumerable: true
  },
  _lastTimestamp: {
    get: function get() {
      return this._bubbles.lastElementChild.querySelector('.ot-message-timestamp');
    },
    configurable: true,
    enumerable: true
  }
});

function ChatMessage(senderId, senderAlias, text) {
  Object.defineProperties(this, {
    senderId: { value: senderId },
    senderAlias: { value: senderAlias },
    text: { value: text },
    dateTime: { value: new Date() }
  });
}

exports.ChatUI = ChatUI;
exports.ChatMessage = ChatMessage;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Chat = require('./Chat');

var _Chat2 = _interopRequireDefault(_Chat);

var _ChatUI = require('./ChatUI');

var links = /https?\:\/\/[^.]+\..+/g;

function ChatWidget(options) {
  options = options || {};
  this._chatBox = new _ChatUI.ChatUI(options);
  this._chatBox.renderMessage = this.renderMessage.bind(this);
  this._chatBox.disableSending();
  if (options.session) {
    this.start(options);
  }
}

ChatWidget.prototype = {
  constructor: ChatWidget,

  start: function start(options) {
    if (!this._chat) {
      this._chat = new _Chat2['default'](options);
      this._chat.onMessageReceived = this.onMessageReceived.bind(this);
      this._chatBox.senderId = options.session.connection.connectionId;
      this._chatBox.senderAlias = options.session.connection.data;
      this._chatBox.onMessageReadyToSend = this.onMessageReadyToSend.bind(this);
      this._chatBox.enableSending();
    }
  },

  onMessageReadyToSend: function onMessageReadyToSend(contents, callback) {
    this._chat.send(contents, callback);
  },

  onMessageReceived: function onMessageReceived(contents, from) {
    var message = new _ChatUI.ChatMessage(from.connectionId, from.data, contents);
    this._chatBox.addMessage(message);
  },

  renderMessage: function renderMessage(raw) {
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

exports['default'] = ChatWidget;
module.exports = exports['default'];

},{"./Chat":1,"./ChatUI":2}],4:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Chat = require('./Chat');

var _Chat2 = _interopRequireDefault(_Chat);

var _ChatUI = require('./ChatUI');

var _ChatWidget = require('./ChatWidget');

var _ChatWidget2 = _interopRequireDefault(_ChatWidget);

OT.TextChat = {
  Chat: _Chat2['default'],
  ChatUI: _ChatUI.ChatUI,
  ChatMessage: _ChatUI.ChatMessage,
  ChatWidget: _ChatWidget2['default']
};

},{"./Chat":1,"./ChatUI":2,"./ChatWidget":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9zYWx2YS93b3Jrc3BhY2Uvb3BlbnRvay10ZXh0Y2hhdC9zcmMvQ2hhdC5qcyIsIi9ob21lL3NhbHZhL3dvcmtzcGFjZS9vcGVudG9rLXRleHRjaGF0L3NyYy9DaGF0VUkuanMiLCIvaG9tZS9zYWx2YS93b3Jrc3BhY2Uvb3BlbnRvay10ZXh0Y2hhdC9zcmMvQ2hhdFdpZGdldC5qcyIsIi9ob21lL3NhbHZhL3dvcmtzcGFjZS9vcGVudG9rLXRleHRjaGF0L3NyYy9vcGVudG9rLXRleHRjaGF0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsWUFBWSxDQUFDOzs7OztBQUViLFNBQVMsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNyQixNQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtBQUFFLFVBQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztHQUFFO0FBQzlFLE1BQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQzs7QUFFaEMsTUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUM7QUFDOUMsTUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLFVBQVUsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDNUUsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7Q0FDbEU7O0FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRztBQUNmLGFBQVcsRUFBRSxJQUFJOztBQUVqQixNQUFJLEVBQUUsY0FBVSxJQUFJLEVBQUUsUUFBUSxFQUFFO0FBQzlCLFFBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJ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ZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBDaGF0KG9wdGlvbnMpIHtcbiAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnNlc3Npb24pIHsgdGhyb3cgbmV3IEVycm9yKCdObyBzZXNzaW9uIHByb3ZpZGVkLicpOyB9XG4gIHRoaXMuX3Nlc3Npb24gPSBvcHRpb25zLnNlc3Npb247XG5cbiAgdmFyIHNpZ25hbE5hbWUgPSBvcHRpb25zLnNpZ25hbE5hbWUgfHwgJ2NoYXQnO1xuICB0aGlzLl9zZXNzaW9uLm9uKCdzaWduYWw6JyArIHNpZ25hbE5hbWUsIHRoaXMuX2hhbmRsZUNoYXRTaWduYWwuYmluZCh0aGlzKSk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc2lnbmFsTmFtZScsIHsgdmFsdWU6IHNpZ25hbE5hbWUgfSk7XG59XG5cbkNoYXQucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogQ2hhdCxcblxuICBzZW5kOiBmdW5jdGlvbiAodGV4dCwgY2FsbGJhY2spIHtcbiAgICB2YXIgc2lnbmFsID0gdGhpcy5fZ2V0TWVzc2FnZVNpZ25hbCh0ZXh0KTtcbiAgICB0aGlzLl9zZXNzaW9uLnNpZ25hbChzaWduYWwsIGNhbGxiYWNrKTtcbiAgfSxcblxuICBvbk1lc3NhZ2VSZWNlaXZlZDogZnVuY3Rpb24gKHR5cGUsIGNhbGxiYWNrKSB7IGNhbGxiYWNrKCk7IH0sXG5cbiAgX2hhbmRsZUNoYXRTaWduYWw6IGZ1bmN0aW9uIChzaWduYWwpIHtcbiAgICB2YXIgbWUgPSB0aGlzLl9zZXNzaW9uLmNvbm5lY3Rpb24uY29ubmVjdGlvbklkO1xuICAgIHZhciBmcm9tID0gc2lnbmFsLmZyb20uY29ubmVjdGlvbklkO1xuICAgIGlmIChmcm9tICE9PSBtZSkge1xuICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLm9uTWVzc2FnZVJlY2VpdmVkO1xuICAgICAgaWYgKGhhbmRsZXIgJiYgdHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaGFuZGxlcihzaWduYWwuZGF0YSwgc2lnbmFsLmZyb20pO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBfZ2V0TWVzc2FnZVNpZ25hbDogZnVuY3Rpb24gKHRleHQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy5zaWduYWxOYW1lLFxuICAgICAgZGF0YTogdGV4dFxuICAgIH07XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IENoYXQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1aUxheW91dCA9IFtcbiAgJzxkaXYgY2xhc3M9XCJvdC1idWJibGVzXCI+JyxcbiAgJzwvZGl2PicsXG4gICc8ZGl2IGNsYXNzPVwib3QtaW5wdXRcIj4nLFxuICAnICA8ZGl2PicsXG4gICcgICAgPHAgY2xhc3M9XCJvdC1lcnJvci16b25lXCIgaGlkZGVuPkVycm9yIHNlbmRpbmcgdGhlIG1lc3NhZ2UhPC9wPicsXG4gICcgICAgPHAgY2xhc3M9XCJvdC1uZXctbWVzc2FnZXNcIiBoaWRkZW4+4pa+Jm5ic3A7TmV3IG1lc3NhZ2VzPC9wPicsXG4gICcgICAgPHRleHRhcmVhIHBsYWNlaG9sZGVyPVwiU2VuZCBhIG1lc3NhZ2UmaGVsbGlwO1wiIGNsYXNzPVwib3QtY29tcG9zZXJcIj4nICtcbiAgJzwvdGV4dGFyZWE+JyxcbiAgJyAgICA8ZGl2IGNsYXNzPVwib3QtYm90dG9tLWxpbmVcIj4nLFxuICAnICAgICAgPHAgY2xhc3M9XCJvdC1jaGFyYWN0ZXItY291bnRlclwiPjxzcGFuPjwvc3Bhbj4gY2hhcmFjdGVycyBsZWZ0PC9wPicsXG4gICcgICAgICA8YnV0dG9uIGNsYXNzPVwib3Qtc2VuZC1idXR0b25cIj5TZW5kJm5ic3A74p+pPC9idXR0b24+JyxcbiAgJyAgICA8L2Rpdj4nLFxuICAnICA8L2Rpdj4nLFxuICAnPC9kaXY+J1xuXS5qb2luKCdcXG4nKTtcblxudmFyIGJ1YmJsZUxheW91dCA9IFtcbiAgJzxkaXY+JyxcbiAgJyAgPGhlYWRlciBjbGFzcz1cIm90LWJ1YmJsZS1oZWFkZXJcIj4nLFxuICAnICAgIDxwIGNsYXNzPVwib3QtbWVzc2FnZS1zZW5kZXJcIj48L3A+JyxcbiAgJyAgICA8dGltZSBjbGFzcz1cIm90LW1lc3NhZ2UtdGltZXN0YW1wXCI+PC90aW1lPicsXG4gICcgIDwvaGVhZGVyPicsXG4gICc8L2Rpdj4nXG5dLmpvaW4oJ1xcbicpO1xuXG5mdW5jdGlvbiBDaGF0VUkob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5zZW5kZXJJZCA9IG9wdGlvbnMuc2VuZGVySWQgfHwgKCcnICsgTWF0aC5yYW5kb20oKSkuc3Vic3RyKDIpO1xuICB0aGlzLnNlbmRlckFsaWFzID0gb3B0aW9ucy5zZW5kZXJBbGlhcyB8fCAnbWUnO1xuICB0aGlzLm1heFRleHRMZW5ndGggPSBvcHRpb25zLm1heFRleHRMZW5ndGggfHwgMTAwMDtcbiAgdGhpcy5ncm91cERlbGF5ID0gb3B0aW9ucy5ncm91cERlbGF5IHx8ICgyICogNjAgKiAxMDAwKTsgLy8gMiBtaW5cbiAgdGhpcy50aW1lb3V0ID0gb3B0aW9ucy50aW1lb3V0IHx8IDUwMDA7XG4gIHRoaXMuX3dhdGNoU2Nyb2xsQXRUaGVCb3R0b20gPSB0aGlzLl93YXRjaFNjcm9sbEF0VGhlQm90dG9tLmJpbmQodGhpcyk7XG4gIHRoaXMuX21lc3NhZ2VzID0gW107XG4gIHRoaXMuX3NldHVwVGVtcGxhdGVzKCk7XG4gIHRoaXMuX3NldHVwVUkob3B0aW9ucy5jb250YWluZXIpO1xuICB0aGlzLl91cGRhdGVDaGFyQ291bnRlcigpO1xufVxuXG5DaGF0VUkucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogQ2hhdFVJLFxuXG4gIF9zZXR1cFRlbXBsYXRlczogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2J1YmJsZVRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICAgIHRoaXMuX2J1YmJsZVRlbXBsYXRlLmlubmVySFRNTCA9IGJ1YmJsZUxheW91dDtcbiAgICB0aGlzLl9idWJibGVUZW1wbGF0ZS5jbGFzc0xpc3QuYWRkKCdvdC1idWJibGUnKTtcbiAgfSxcblxuICBfc2V0dXBVSTogZnVuY3Rpb24gKHBhcmVudCkge1xuICAgIHBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocGFyZW50KSB8fCBkb2N1bWVudC5ib2R5O1xuXG4gICAgdmFyIGNoYXRWaWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICAgIGNoYXRWaWV3LmlubmVySFRNTCA9IHVpTGF5b3V0O1xuICAgIGNoYXRWaWV3LmNsYXNzTGlzdC5hZGQoJ290LXRleHRjaGF0Jyk7XG5cbiAgICB2YXIgc2VuZEJ1dHRvbiA9IGNoYXRWaWV3LnF1ZXJ5U2VsZWN0b3IoJy5vdC1zZW5kLWJ1dHRvbicpO1xuICAgIHZhciBjb21wb3NlciA9IGNoYXRWaWV3LnF1ZXJ5U2VsZWN0b3IoJy5vdC1jb21wb3NlcicpO1xuICAgIHZhciBjaGFyQ291bnRlciA9IGNoYXRWaWV3LnF1ZXJ5U2VsZWN0b3IoJy5vdC1jaGFyYWN0ZXItY291bnRlciA+IHNwYW4nKTtcbiAgICB2YXIgZXJyb3Jab25lID0gY2hhdFZpZXcucXVlcnlTZWxlY3RvcignLm90LWVycm9yLXpvbmUnKTtcbiAgICB2YXIgbmV3TWVzc2FnZXMgPSBjaGF0Vmlldy5xdWVyeVNlbGVjdG9yKCcub3QtbmV3LW1lc3NhZ2VzJyk7XG5cbiAgICB0aGlzLl9jb21wb3NlciA9IGNvbXBvc2VyO1xuICAgIHRoaXMuX3NlbmRCdXR0b24gPSBzZW5kQnV0dG9uO1xuICAgIHRoaXMuX2NoYXJDb3VudGVyID0gY2hhckNvdW50ZXI7XG4gICAgdGhpcy5fYnViYmxlcyA9IGNoYXRWaWV3LmZpcnN0RWxlbWVudENoaWxkO1xuICAgIHRoaXMuX2Vycm9yWm9uZSA9IGVycm9yWm9uZTtcbiAgICB0aGlzLl9uZXdNZXNzYWdlcyA9IG5ld01lc3NhZ2VzO1xuXG4gICAgLy8gWFhYOiBJdCdzIGFscmVhZHkgYm91bmQgaW4gdGhlIGNvbnN0cnVjdG9yXG4gICAgdGhpcy5fYnViYmxlcy5vbnNjcm9sbCA9IHRoaXMuX3dhdGNoU2Nyb2xsQXRUaGVCb3R0b207XG4gICAgdGhpcy5fc2VuZEJ1dHRvbi5vbmNsaWNrID0gdGhpcy5fc2VuZE1lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9jb21wb3Nlci5vbmtleXVwID0gdGhpcy5fdXBkYXRlQ2hhckNvdW50ZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9jb21wb3Nlci5vbmtleWRvd24gPSB0aGlzLl9jb250cm9sQ29tcG9zZXJJbnB1dC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX25ld01lc3NhZ2VzLm9uY2xpY2sgPSB0aGlzLl9nb1RvTmV3TWVzc2FnZXMuYmluZCh0aGlzKTtcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjaGF0Vmlldyk7XG4gIH0sXG5cbiAgX3dhdGNoU2Nyb2xsQXRUaGVCb3R0b206IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5faXNBdEJvdHRvbSgpKSB7XG4gICAgICB0aGlzLl9oaWRlTmV3TWVzc2FnZUFsZXJ0KCk7XG4gICAgfVxuICB9LFxuXG4gIF9zZW5kTWVzc2FnZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdmFyIGNvbnRlbnRzID0gdGhpcy5fY29tcG9zZXIudmFsdWU7XG5cbiAgICBpZiAoY29udGVudHMubGVuZ3RoID4gX3RoaXMubWF4VGV4dExlbmd0aCkge1xuICAgICAgX3RoaXMuX3Nob3dUb29Mb25nVGV4dEVycm9yKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgX3RoaXMuX2hpZGVFcnJvcnMoKTtcbiAgICAgIGlmICh0eXBlb2YgX3RoaXMub25NZXNzYWdlUmVhZHlUb1NlbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgX3RoaXMuZGlzYWJsZVNlbmRpbmcoKTtcblxuICAgICAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIF90aGlzLl9zaG93RXJyb3IoKTtcbiAgICAgICAgICBfdGhpcy5lbmFibGVTZW5kaW5nKCk7XG4gICAgICAgIH0sIF90aGlzLnRpbWVvdXQpO1xuXG4gICAgICAgIHZhciBzZW50ID0gX3RoaXMub25NZXNzYWdlUmVhZHlUb1NlbmQoY29udGVudHMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgX3RoaXMuX3Nob3dFcnJvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIF90aGlzLmFkZE1lc3NhZ2UobmV3IENoYXRNZXNzYWdlKFxuICAgICAgICAgICAgICBfdGhpcy5zZW5kZXJJZCxcbiAgICAgICAgICAgICAgX3RoaXMuc2VuZGVyQWxpYXMsXG4gICAgICAgICAgICAgIGNvbnRlbnRzXG4gICAgICAgICAgICApKTtcbiAgICAgICAgICAgIF90aGlzLl9jb21wb3Nlci52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgX3RoaXMuX3VwZGF0ZUNoYXJDb3VudGVyKCk7XG4gICAgICAgICAgICBfdGhpcy5faGlkZUVycm9ycygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfdGhpcy5lbmFibGVTZW5kaW5nKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIF9zaG93VG9vTG9uZ1RleHRFcnJvcjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2NoYXJDb3VudGVyLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZXJyb3InKTtcbiAgfSxcblxuICBfaGlkZVRvb0xvbmdUZXh0RXJyb3I6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jaGFyQ291bnRlci5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2Vycm9yJyk7XG4gIH0sXG5cbiAgX3Nob3dOZXdNZXNzYWdlQWxlcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9uZXdNZXNzYWdlcy5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpO1xuICB9LFxuXG4gIF9oaWRlTmV3TWVzc2FnZUFsZXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fbmV3TWVzc2FnZXMuaGlkZGVuID0gdHJ1ZTtcbiAgfSxcblxuICBfc2hvd0Vycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZXJyb3Jab25lLmhpZGRlbiA9IGZhbHNlO1xuICB9LFxuXG4gIF9oaWRlRXJyb3JzOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZXJyb3Jab25lLmhpZGRlbiA9IHRydWU7XG4gICAgdGhpcy5faGlkZVRvb0xvbmdUZXh0RXJyb3IoKTtcbiAgfSxcblxuICBfc2hvd0Vycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZXJyb3Jab25lLmhpZGRlbiA9IGZhbHNlO1xuICB9LFxuXG4gIF9jb250cm9sQ29tcG9zZXJJbnB1dDogZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBpc0VudGVyID0gZXZ0LndoaWNoID09PSAxMyB8fCBldnQua2V5Q29kZSA9PT0gMTM7XG4gICAgaWYgKCFldnQuc2hpZnRLZXkgJiYgaXNFbnRlcikge1xuICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLl9zZW5kTWVzc2FnZSgpO1xuICAgIH1cbiAgfSxcblxuICBfZ29Ub05ld01lc3NhZ2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB0aGlzLl9oaWRlTmV3TWVzc2FnZUFsZXJ0KCk7XG4gIH0sXG5cbiAgX3VwZGF0ZUNoYXJDb3VudGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlbWFpbmluZyA9IHRoaXMubWF4VGV4dExlbmd0aCAtIHRoaXMuX2NvbXBvc2VyLnZhbHVlLmxlbmd0aDtcbiAgICB2YXIgaXNWYWxpZCA9IHJlbWFpbmluZyA+PSAwO1xuICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICB0aGlzLl9oaWRlVG9vTG9uZ1RleHRFcnJvcigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuX3Nob3dUb29Mb25nVGV4dEVycm9yKCk7XG4gICAgfVxuICAgIHRoaXMuX2NoYXJDb3VudGVyLnRleHRDb250ZW50ID0gcmVtYWluaW5nO1xuICB9LFxuXG4gIGFkZE1lc3NhZ2U6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgdmFyIHNob3VsZEdyb3VwID0gdGhpcy5fc2hvdWxkR3JvdXAobWVzc2FnZSk7XG4gICAgdmFyIHNob3VsZFNjcm9sbCA9IHRoaXMuX3Nob3VsZFNjcm9sbCgpO1xuICAgIHRoaXNbIHNob3VsZEdyb3VwID8gJ19ncm91cEJ1YmJsZScgOiAnX2FkZE5ld0J1YmJsZScgXShtZXNzYWdlKTtcbiAgICBpZiAoc2hvdWxkU2Nyb2xsKSB7XG4gICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuX3Nob3dOZXdNZXNzYWdlQWxlcnQoKTtcbiAgICB9XG4gICAgdGhpcy5fbWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgfSxcblxuICByZW5kZXJNZXNzYWdlOiBmdW5jdGlvbiAocmF3LCBpc0dyb3VwaW5nKSB7XG4gICAgcmV0dXJuIHJhdztcbiAgfSxcblxuICBlbmFibGVTZW5kaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fc2VuZEJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgdGhpcy5fY29tcG9zZXIucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgIHRoaXMuX2NvbXBvc2VyLmZvY3VzKCk7XG4gIH0sXG5cbiAgZGlzYWJsZVNlbmRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9zZW5kQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB0aGlzLl9jb21wb3Nlci5kaXNhYmxlZCA9IHRydWU7XG4gIH0sXG5cbiAgX3Nob3VsZEdyb3VwOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGlmICh0aGlzLl9sYXN0TWVzc2FnZSAmJiB0aGlzLl9sYXN0TWVzc2FnZS5zZW5kZXJJZCA9PT0gbWVzc2FnZS5zZW5kZXJJZCkge1xuICAgICAgdmFyIHJlZmVyZW5jZSA9IHRoaXMuX2xhc3RNZXNzYWdlLmRhdGVUaW1lLmdldFRpbWUoKTtcbiAgICAgIHZhciBuZXdEYXRlID0gbWVzc2FnZS5kYXRlVGltZS5nZXRUaW1lKCk7XG4gICAgICByZXR1cm4gbmV3RGF0ZSAtIHJlZmVyZW5jZSA8IHRoaXMuZ3JvdXBEZWxheTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIF9zaG91bGRTY3JvbGw6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNBdEJvdHRvbSgpO1xuICB9LFxuXG4gIF9pc0F0Qm90dG9tOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJ1YmJsZXMgPSB0aGlzLl9idWJibGVzO1xuICAgIHJldHVybiBidWJibGVzLnNjcm9sbEhlaWdodCAtIGJ1YmJsZXMuc2Nyb2xsVG9wID09PSBidWJibGVzLmNsaWVudEhlaWdodDtcbiAgfSxcblxuICBfc2Nyb2xsVG9Cb3R0b206IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9idWJibGVzLnNjcm9sbFRvcCA9IHRoaXMuX2J1YmJsZXMuc2Nyb2xsSGVpZ2h0O1xuICB9LFxuXG4gIF9ncm91cEJ1YmJsZTogZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICB2YXIgY29udGVudHMgPSB0aGlzLnJlbmRlck1lc3NhZ2UobWVzc2FnZS50ZXh0LCB0cnVlKTtcbiAgICB0aGlzLl9sYXN0QnViYmxlLmFwcGVuZENoaWxkKHRoaXMuX2dldEJ1YmJsZUNvbnRlbnQoY29udGVudHMpKTtcbiAgICB0aGlzLl9sYXN0VGltZXN0YW1wLnRleHRDb250ZW50ID0gdGhpcy5odW1hbml6ZURhdGUobWVzc2FnZS5kYXRlVGltZSk7XG4gIH0sXG5cbiAgX2FkZE5ld0J1YmJsZTogZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICB0aGlzLl9idWJibGVzLmFwcGVuZENoaWxkKHRoaXMuX2dldEJ1YmJsZShtZXNzYWdlKSk7XG4gIH0sXG5cbiAgZ2V0IF9sYXN0TWVzc2FnZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fbWVzc2FnZXNbdGhpcy5fbWVzc2FnZXMubGVuZ3RoIC0gMV07XG4gIH0sXG5cbiAgZ2V0IF9sYXN0QnViYmxlKCkge1xuICAgIHJldHVybiB0aGlzLl9idWJibGVzLmxhc3RFbGVtZW50Q2hpbGQucXVlcnlTZWxlY3RvcignZGl2Jyk7XG4gIH0sXG5cbiAgZ2V0IF9sYXN0VGltZXN0YW1wKCkge1xuICAgIHJldHVybiB0aGlzLl9idWJibGVzXG4gICAgICAubGFzdEVsZW1lbnRDaGlsZC5xdWVyeVNlbGVjdG9yKCcub3QtbWVzc2FnZS10aW1lc3RhbXAnKTtcbiAgfSxcblxuICBfZ2V0QnViYmxlQ29udGVudDogZnVuY3Rpb24gKHNhZmVIdG1sKSB7XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0RJVicpO1xuICAgIGRpdi5jbGFzc0xpc3QuYWRkKCdvdC1tZXNzYWdlLWNvbnRlbnQnKTtcbiAgICBkaXYuaW5uZXJIVE1MID0gc2FmZUh0bWw7XG4gICAgcmV0dXJuIGRpdjtcbiAgfSxcblxuICBfZ2V0QnViYmxlOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIHZhciBidWJibGUgPSB0aGlzLl9idWJibGVUZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdmFyIHdyYXBwZXIgPSBidWJibGUucXVlcnlTZWxlY3RvcignZGl2Jyk7XG4gICAgdmFyIHNlbmRlciA9IHdyYXBwZXIucXVlcnlTZWxlY3RvcignLm90LW1lc3NhZ2Utc2VuZGVyJyk7XG4gICAgdmFyIHRpbWVzdGFtcCA9IHdyYXBwZXIucXVlcnlTZWxlY3RvcignLm90LW1lc3NhZ2UtdGltZXN0YW1wJyk7XG5cbiAgICAvLyBTZW5kZXIgJiBhbGlhc1xuICAgIGJ1YmJsZS5kYXRhc2V0LnNlbmRlcklkID0gbWVzc2FnZS5zZW5kZXJJZDtcbiAgICBpZiAobWVzc2FnZS5zZW5kZXJJZCA9PT0gdGhpcy5zZW5kZXJJZCkge1xuICAgICAgYnViYmxlLmNsYXNzTGlzdC5hZGQoJ21pbmUnKTtcbiAgICB9XG4gICAgc2VuZGVyLnRleHRDb250ZW50ID0gbWVzc2FnZS5zZW5kZXJBbGlhcztcblxuICAgIC8vIENvbnRlbnRcbiAgICB2YXIgY29udGVudHMgPSB0aGlzLnJlbmRlck1lc3NhZ2UobWVzc2FnZS50ZXh0LCBmYWxzZSk7XG4gICAgd3JhcHBlci5hcHBlbmRDaGlsZCh0aGlzLl9nZXRCdWJibGVDb250ZW50KGNvbnRlbnRzKSk7XG5cbiAgICAvLyBUaW1lc3RhbXBcbiAgICB0aW1lc3RhbXAuZGF0ZVRpbWUgPSBtZXNzYWdlLmRhdGVUaW1lLnRvSVNPU3RyaW5nKCk7XG4gICAgdGltZXN0YW1wLnRleHRDb250ZW50ID0gdGhpcy5odW1hbml6ZURhdGUobWVzc2FnZS5kYXRlVGltZSk7XG5cbiAgICByZXR1cm4gYnViYmxlO1xuICB9LFxuXG4gIGh1bWFuaXplRGF0ZTogZnVuY3Rpb24gKGRhdGUpIHtcbiAgICB2YXIgaG91cnMgPSBkYXRlLmdldEhvdXJzKCk7XG4gICAgdmFyIGlzQU0gPSBob3VycyA8IDEyO1xuICAgIHZhciBob3VyczEyID0gaG91cnMgPiAxMiA/IGhvdXJzIC0gMTIgOiBob3VycztcbiAgICB2YXIgbWludXRlcyA9IGRhdGUuZ2V0TWludXRlcygpO1xuICAgIG1pbnV0ZXMgPSAobWludXRlcyA8IDEwID8gJzAnIDogJycpICsgbWludXRlcztcbiAgICByZXR1cm4gaG91cnMgKyAnOicgKyBtaW51dGVzICsgKGlzQU0gPyAnIEFNJyA6ICcgUE0nKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gQ2hhdE1lc3NhZ2Uoc2VuZGVySWQsIHNlbmRlckFsaWFzLCB0ZXh0KSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICBzZW5kZXJJZDogeyB2YWx1ZTogc2VuZGVySWQgfSxcbiAgICBzZW5kZXJBbGlhczogeyB2YWx1ZTogc2VuZGVyQWxpYXMgfSxcbiAgICB0ZXh0OiB7IHZhbHVlOiB0ZXh0IH0sXG4gICAgZGF0ZVRpbWU6IHsgdmFsdWU6IG5ldyBEYXRlKCkgfVxuICB9KTtcbn1cblxuZXhwb3J0IHsgQ2hhdFVJLCBDaGF0TWVzc2FnZSB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgQ2hhdCBmcm9tICcuL0NoYXQnO1xuaW1wb3J0IHsgQ2hhdFVJLCBDaGF0TWVzc2FnZSB9IGZyb20gJy4vQ2hhdFVJJztcblxudmFyIGxpbmtzID0gL2h0dHBzP1xcOlxcL1xcL1teLl0rXFwuLisvZztcblxuZnVuY3Rpb24gQ2hhdFdpZGdldChvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLl9jaGF0Qm94ID0gbmV3IENoYXRVSShvcHRpb25zKTtcbiAgdGhpcy5fY2hhdEJveC5yZW5kZXJNZXNzYWdlID0gdGhpcy5yZW5kZXJNZXNzYWdlLmJpbmQodGhpcyk7XG4gIHRoaXMuX2NoYXRCb3guZGlzYWJsZVNlbmRpbmcoKTtcbiAgaWYgKG9wdGlvbnMuc2Vzc2lvbikge1xuICAgIHRoaXMuc3RhcnQob3B0aW9ucyk7XG4gIH1cbn1cblxuQ2hhdFdpZGdldC5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBDaGF0V2lkZ2V0LFxuXG4gIHN0YXJ0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGlmICghdGhpcy5fY2hhdCkge1xuICAgICAgdGhpcy5fY2hhdCA9IG5ldyBDaGF0KG9wdGlvbnMpO1xuICAgICAgdGhpcy5fY2hhdC5vbk1lc3NhZ2VSZWNlaXZlZCA9IHRoaXMub25NZXNzYWdlUmVjZWl2ZWQuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX2NoYXRCb3guc2VuZGVySWQgPSBvcHRpb25zLnNlc3Npb24uY29ubmVjdGlvbi5jb25uZWN0aW9uSWQ7XG4gICAgICB0aGlzLl9jaGF0Qm94LnNlbmRlckFsaWFzID0gb3B0aW9ucy5zZXNzaW9uLmNvbm5lY3Rpb24uZGF0YTtcbiAgICAgIHRoaXMuX2NoYXRCb3gub25NZXNzYWdlUmVhZHlUb1NlbmQgPSB0aGlzLm9uTWVzc2FnZVJlYWR5VG9TZW5kLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9jaGF0Qm94LmVuYWJsZVNlbmRpbmcoKTtcbiAgICB9XG4gIH0sXG5cbiAgb25NZXNzYWdlUmVhZHlUb1NlbmQ6IGZ1bmN0aW9uIChjb250ZW50cywgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9jaGF0LnNlbmQoY29udGVudHMsIGNhbGxiYWNrKTtcbiAgfSxcblxuICBvbk1lc3NhZ2VSZWNlaXZlZDogZnVuY3Rpb24gKGNvbnRlbnRzLCBmcm9tKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBuZXcgQ2hhdE1lc3NhZ2UoZnJvbS5jb25uZWN0aW9uSWQsIGZyb20uZGF0YSwgY29udGVudHMpO1xuICAgIHRoaXMuX2NoYXRCb3guYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgfSxcblxuICByZW5kZXJNZXNzYWdlOiBmdW5jdGlvbiAocmF3KSB7XG4gICAgdmFyIG91dHB1dDtcblxuICAgIC8vIEFsbG93IG11bHRpbGluZVxuICAgIG91dHB1dCA9IHJhdy5yZXBsYWNlKC8oXFxyXFxufFxccnxcXG4pL2csICc8YnIvPicpO1xuXG4gICAgLy8gRGV0ZWN0IGxpbmtzXG4gICAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UobGlua3MsIGZ1bmN0aW9uIChocmVmKSB7XG4gICAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgaHJlZiArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj4nICsgaHJlZiArICc8L2E+JztcbiAgICB9KTtcblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IENoYXRXaWRnZXQ7XG4iLCJcbmltcG9ydCBDaGF0IGZyb20gJy4vQ2hhdCc7XG5pbXBvcnQgeyBDaGF0VUksIENoYXRNZXNzYWdlIH0gZnJvbSAnLi9DaGF0VUknO1xuaW1wb3J0IENoYXRXaWRnZXQgZnJvbSAnLi9DaGF0V2lkZ2V0JztcblxuT1QuVGV4dENoYXQgPSB7XG4gIENoYXQ6IENoYXQsXG4gIENoYXRVSTogQ2hhdFVJLFxuICBDaGF0TWVzc2FnZTogQ2hhdE1lc3NhZ2UsXG4gIENoYXRXaWRnZXQ6IENoYXRXaWRnZXRcbn07XG4iXX0=
