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

  render: function render(raw, isGrouping) {
    return raw.replace(/(\r\n|\r|\n)/g, '<br/>');
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
    var contents = this.render(message.text, true);
    this._lastBubble.appendChild(this._getBubbleContent(contents));
    this._lastTimestamp.textContent = this.humanizeDate(message.dateTime);
  },

  _addNewBubble: function _addNewBubble(message) {
    this._bubbles.appendChild(this._getBubble(message));
  },

  _getBubbleContent: function _getBubbleContent(safeHtml) {
    var div = document.createElement('DIV');
    div.classList.add('ot-bubble-content');
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
    var contents = this.render(message.text, false);
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

function ChatWidget(options) {
  options = options || {};
  this._chatBox = new _ChatUI.ChatUI(options);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9zYWx2YS93b3Jrc3BhY2Uvb3BlbnRvay10ZXh0Y2hhdC9zcmMvQ2hhdC5qcyIsIi9ob21lL3NhbHZhL3dvcmtzcGFjZS9vcGVudG9rLXRleHRjaGF0L3NyYy9DaGF0VUkuanMiLCIvaG9tZS9zYWx2YS93b3Jrc3BhY2Uvb3BlbnRvay10ZXh0Y2hhdC9zcmMvQ2hhdFdpZGdldC5qcyIsIi9ob21lL3NhbHZhL3dvcmtzcGFjZS9vcGVudG9rLXRleHRjaGF0L3NyYy9vcGVudG9rLXRleHRjaGF0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsWUFBWSxDQUFDOzs7OztBQUViLFNBQVMsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNyQixNQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtBQUFFLFVBQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztHQUFFO0FBQzlFLE1BQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQzs7QUFFaEMsTUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUM7QUFDOUMsTUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLFVBQVUsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDNUUsUUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7Q0FDbEU7O0FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRztBQUNmLGFBQVcsRUFBRSxJQUFJOztBQUVqQixNQUFJLEVBQUUsY0FBVSxJQUFJLEVBQUUsUUFBUSxFQUFFO0FBQzlCLFFBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJ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LENBQUM7QUFDMUUsVUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztLQUMvQjtHQUNGOztBQUVELHNCQUFvQixFQUFFLDhCQUFVLFFBQVEsRUFBRSxRQUFRLEVBQUU7QUFDbEQsUUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0dBQ3JDOztBQUVELG1CQUFpQixFQUFFLDJCQUFVLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDM0MsUUFBSSxPQUFPLEdBQUcsd0JBQWdCLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN0RSxRQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztHQUNuQztDQUNGLENBQUM7O3FCQUVhLFVBQVU7Ozs7Ozs7O29CQ3JDUixRQUFROzs7O3NCQUNXLFVBQVU7OzBCQUN2QixjQUFjOzs7O0FBRXJDLEVBQUUsQ0FBQyxRQUFRLEdBQUc7QUFDWixNQUFJLG1CQUFNO0FBQ1YsUUFBTSxnQkFBUTtBQUNkLGFBQVcscUJBQWE7QUFDeEIsWUFBVSx5QkFBWTtDQUN2QixDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gQ2hhdChvcHRpb25zKSB7XG4gIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5zZXNzaW9uKSB7IHRocm93IG5ldyBFcnJvcignTm8gc2Vzc2lvbiBwcm92aWRlZC4nKTsgfVxuICB0aGlzLl9zZXNzaW9uID0gb3B0aW9ucy5zZXNzaW9uO1xuXG4gIHZhciBzaWduYWxOYW1lID0gb3B0aW9ucy5zaWduYWxOYW1lIHx8ICdjaGF0JztcbiAgdGhpcy5fc2Vzc2lvbi5vbignc2lnbmFsOicgKyBzaWduYWxOYW1lLCB0aGlzLl9oYW5kbGVDaGF0U2lnbmFsLmJpbmQodGhpcykpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3NpZ25hbE5hbWUnLCB7IHZhbHVlOiBzaWduYWxOYW1lIH0pO1xufVxuXG5DaGF0LnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IENoYXQsXG5cbiAgc2VuZDogZnVuY3Rpb24gKHRleHQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNpZ25hbCA9IHRoaXMuX2dldE1lc3NhZ2VTaWduYWwodGV4dCk7XG4gICAgdGhpcy5fc2Vzc2lvbi5zaWduYWwoc2lnbmFsLCBjYWxsYmFjayk7XG4gIH0sXG5cbiAgb25NZXNzYWdlUmVjZWl2ZWQ6IGZ1bmN0aW9uICh0eXBlLCBjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9LFxuXG4gIF9oYW5kbGVDaGF0U2lnbmFsOiBmdW5jdGlvbiAoc2lnbmFsKSB7XG4gICAgdmFyIG1lID0gdGhpcy5fc2Vzc2lvbi5jb25uZWN0aW9uLmNvbm5lY3Rpb25JZDtcbiAgICB2YXIgZnJvbSA9IHNpZ25hbC5mcm9tLmNvbm5lY3Rpb25JZDtcbiAgICBpZiAoZnJvbSAhPT0gbWUpIHtcbiAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5vbk1lc3NhZ2VSZWNlaXZlZDtcbiAgICAgIGlmIChoYW5kbGVyICYmIHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGhhbmRsZXIoc2lnbmFsLmRhdGEsIHNpZ25hbC5mcm9tKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgX2dldE1lc3NhZ2VTaWduYWw6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMuc2lnbmFsTmFtZSxcbiAgICAgIGRhdGE6IHRleHRcbiAgICB9O1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDaGF0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdWlMYXlvdXQgPSBbXG4gICc8ZGl2IGNsYXNzPVwib3QtYnViYmxlc1wiPicsXG4gICc8L2Rpdj4nLFxuICAnPGRpdiBjbGFzcz1cIm90LWlucHV0XCI+JyxcbiAgJyAgPGRpdj4nLFxuICAnICAgIDxwIGNsYXNzPVwib3QtZXJyb3Item9uZVwiIGhpZGRlbj5FcnJvciBzZW5kaW5nIHRoZSBtZXNzYWdlITwvcD4nLFxuICAnICAgIDxwIGNsYXNzPVwib3QtbmV3LW1lc3NhZ2VzXCIgaGlkZGVuPuKWviZuYnNwO05ldyBtZXNzYWdlczwvcD4nLFxuICAnICAgIDx0ZXh0YXJlYSBwbGFjZWhvbGRlcj1cIlNlbmQgYSBtZXNzYWdlJmhlbGxpcDtcIiBjbGFzcz1cIm90LWNvbXBvc2VyXCI+JyArXG4gICc8L3RleHRhcmVhPicsXG4gICcgICAgPGRpdiBjbGFzcz1cIm90LWJvdHRvbS1saW5lXCI+JyxcbiAgJyAgICAgIDxwIGNsYXNzPVwib3QtY2hhcmFjdGVyLWNvdW50ZXJcIj48c3Bhbj48L3NwYW4+IGNoYXJhY3RlcnMgbGVmdDwvcD4nLFxuICAnICAgICAgPGJ1dHRvbiBjbGFzcz1cIm90LXNlbmQtYnV0dG9uXCI+U2VuZCZuYnNwO+KfqTwvYnV0dG9uPicsXG4gICcgICAgPC9kaXY+JyxcbiAgJyAgPC9kaXY+JyxcbiAgJzwvZGl2Pidcbl0uam9pbignXFxuJyk7XG5cbnZhciBidWJibGVMYXlvdXQgPSBbXG4gICc8ZGl2PicsXG4gICcgIDxoZWFkZXIgY2xhc3M9XCJvdC1idWJibGUtaGVhZGVyXCI+JyxcbiAgJyAgICA8cCBjbGFzcz1cIm90LW1lc3NhZ2Utc2VuZGVyXCI+PC9wPicsXG4gICcgICAgPHRpbWUgY2xhc3M9XCJvdC1tZXNzYWdlLXRpbWVzdGFtcFwiPjwvdGltZT4nLFxuICAnICA8L2hlYWRlcj4nLFxuICAnPC9kaXY+J1xuXS5qb2luKCdcXG4nKTtcblxuZnVuY3Rpb24gQ2hhdFVJKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMuc2VuZGVySWQgPSBvcHRpb25zLnNlbmRlcklkIHx8ICgnJyArIE1hdGgucmFuZG9tKCkpLnN1YnN0cigyKTtcbiAgdGhpcy5zZW5kZXJBbGlhcyA9IG9wdGlvbnMuc2VuZGVyQWxpYXMgfHwgJ21lJztcbiAgdGhpcy5tYXhUZXh0TGVuZ3RoID0gb3B0aW9ucy5tYXhUZXh0TGVuZ3RoIHx8IDEwMDA7XG4gIHRoaXMuZ3JvdXBEZWxheSA9IG9wdGlvbnMuZ3JvdXBEZWxheSB8fCAoMiAqIDYwICogMTAwMCk7IC8vIDIgbWluXG4gIHRoaXMudGltZW91dCA9IG9wdGlvbnMudGltZW91dCB8fCA1MDAwO1xuICB0aGlzLl93YXRjaFNjcm9sbEF0VGhlQm90dG9tID0gdGhpcy5fd2F0Y2hTY3JvbGxBdFRoZUJvdHRvbS5iaW5kKHRoaXMpO1xuICB0aGlzLl9tZXNzYWdlcyA9IFtdO1xuICB0aGlzLl9zZXR1cFRlbXBsYXRlcygpO1xuICB0aGlzLl9zZXR1cFVJKG9wdGlvbnMuY29udGFpbmVyKTtcbiAgdGhpcy5fdXBkYXRlQ2hhckNvdW50ZXIoKTtcbn1cblxuQ2hhdFVJLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IENoYXRVSSxcblxuICBfc2V0dXBUZW1wbGF0ZXM6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9idWJibGVUZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgICB0aGlzLl9idWJibGVUZW1wbGF0ZS5pbm5lckhUTUwgPSBidWJibGVMYXlvdXQ7XG4gICAgdGhpcy5fYnViYmxlVGVtcGxhdGUuY2xhc3NMaXN0LmFkZCgnb3QtYnViYmxlJyk7XG4gIH0sXG5cbiAgX3NldHVwVUk6IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICBwYXJlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHBhcmVudCkgfHwgZG9jdW1lbnQuYm9keTtcblxuICAgIHZhciBjaGF0VmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgICBjaGF0Vmlldy5pbm5lckhUTUwgPSB1aUxheW91dDtcbiAgICBjaGF0Vmlldy5jbGFzc0xpc3QuYWRkKCdvdC10ZXh0Y2hhdCcpO1xuXG4gICAgdmFyIHNlbmRCdXR0b24gPSBjaGF0Vmlldy5xdWVyeVNlbGVjdG9yKCcub3Qtc2VuZC1idXR0b24nKTtcbiAgICB2YXIgY29tcG9zZXIgPSBjaGF0Vmlldy5xdWVyeVNlbGVjdG9yKCcub3QtY29tcG9zZXInKTtcbiAgICB2YXIgY2hhckNvdW50ZXIgPSBjaGF0Vmlldy5xdWVyeVNlbGVjdG9yKCcub3QtY2hhcmFjdGVyLWNvdW50ZXIgPiBzcGFuJyk7XG4gICAgdmFyIGVycm9yWm9uZSA9IGNoYXRWaWV3LnF1ZXJ5U2VsZWN0b3IoJy5vdC1lcnJvci16b25lJyk7XG4gICAgdmFyIG5ld01lc3NhZ2VzID0gY2hhdFZpZXcucXVlcnlTZWxlY3RvcignLm90LW5ldy1tZXNzYWdlcycpO1xuXG4gICAgdGhpcy5fY29tcG9zZXIgPSBjb21wb3NlcjtcbiAgICB0aGlzLl9zZW5kQnV0dG9uID0gc2VuZEJ1dHRvbjtcbiAgICB0aGlzLl9jaGFyQ291bnRlciA9IGNoYXJDb3VudGVyO1xuICAgIHRoaXMuX2J1YmJsZXMgPSBjaGF0Vmlldy5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICB0aGlzLl9lcnJvclpvbmUgPSBlcnJvclpvbmU7XG4gICAgdGhpcy5fbmV3TWVzc2FnZXMgPSBuZXdNZXNzYWdlcztcblxuICAgIC8vIFhYWDogSXQncyBhbHJlYWR5IGJvdW5kIGluIHRoZSBjb25zdHJ1Y3RvclxuICAgIHRoaXMuX2J1YmJsZXMub25zY3JvbGwgPSB0aGlzLl93YXRjaFNjcm9sbEF0VGhlQm90dG9tO1xuICAgIHRoaXMuX3NlbmRCdXR0b24ub25jbGljayA9IHRoaXMuX3NlbmRNZXNzYWdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fY29tcG9zZXIub25rZXl1cCA9IHRoaXMuX3VwZGF0ZUNoYXJDb3VudGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fY29tcG9zZXIub25rZXlkb3duID0gdGhpcy5fY29udHJvbENvbXBvc2VySW5wdXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9uZXdNZXNzYWdlcy5vbmNsaWNrID0gdGhpcy5fZ29Ub05ld01lc3NhZ2VzLmJpbmQodGhpcyk7XG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hhdFZpZXcpO1xuICB9LFxuXG4gIF93YXRjaFNjcm9sbEF0VGhlQm90dG9tOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2lzQXRCb3R0b20oKSkge1xuICAgICAgdGhpcy5faGlkZU5ld01lc3NhZ2VBbGVydCgpO1xuICAgIH1cbiAgfSxcblxuICBfc2VuZE1lc3NhZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciBjb250ZW50cyA9IHRoaXMuX2NvbXBvc2VyLnZhbHVlO1xuXG4gICAgaWYgKGNvbnRlbnRzLmxlbmd0aCA+IF90aGlzLm1heFRleHRMZW5ndGgpIHtcbiAgICAgIF90aGlzLl9zaG93VG9vTG9uZ1RleHRFcnJvcigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIF90aGlzLl9oaWRlRXJyb3JzKCk7XG4gICAgICBpZiAodHlwZW9mIF90aGlzLm9uTWVzc2FnZVJlYWR5VG9TZW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIF90aGlzLmRpc2FibGVTZW5kaW5nKCk7XG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBfdGhpcy5fc2hvd0Vycm9yKCk7XG4gICAgICAgICAgX3RoaXMuZW5hYmxlU2VuZGluZygpO1xuICAgICAgICB9LCBfdGhpcy50aW1lb3V0KTtcblxuICAgICAgICB2YXIgc2VudCA9IF90aGlzLm9uTWVzc2FnZVJlYWR5VG9TZW5kKGNvbnRlbnRzLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIF90aGlzLl9zaG93RXJyb3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBfdGhpcy5hZGRNZXNzYWdlKG5ldyBDaGF0TWVzc2FnZShcbiAgICAgICAgICAgICAgX3RoaXMuc2VuZGVySWQsXG4gICAgICAgICAgICAgIF90aGlzLnNlbmRlckFsaWFzLFxuICAgICAgICAgICAgICBjb250ZW50c1xuICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICBfdGhpcy5fY29tcG9zZXIudmFsdWUgPSAnJztcbiAgICAgICAgICAgIF90aGlzLl91cGRhdGVDaGFyQ291bnRlcigpO1xuICAgICAgICAgICAgX3RoaXMuX2hpZGVFcnJvcnMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMuZW5hYmxlU2VuZGluZygpO1xuICAgICAgICB9KTtcblxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBfc2hvd1Rvb0xvbmdUZXh0RXJyb3I6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jaGFyQ291bnRlci5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2Vycm9yJyk7XG4gIH0sXG5cbiAgX2hpZGVUb29Mb25nVGV4dEVycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fY2hhckNvdW50ZXIucGFyZW50RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdlcnJvcicpO1xuICB9LFxuXG4gIF9zaG93TmV3TWVzc2FnZUFsZXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fbmV3TWVzc2FnZXMucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKTtcbiAgfSxcblxuICBfaGlkZU5ld01lc3NhZ2VBbGVydDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX25ld01lc3NhZ2VzLmhpZGRlbiA9IHRydWU7XG4gIH0sXG5cbiAgX3Nob3dFcnJvcjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2Vycm9yWm9uZS5oaWRkZW4gPSBmYWxzZTtcbiAgfSxcblxuICBfaGlkZUVycm9yczogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2Vycm9yWm9uZS5oaWRkZW4gPSB0cnVlO1xuICAgIHRoaXMuX2hpZGVUb29Mb25nVGV4dEVycm9yKCk7XG4gIH0sXG5cbiAgX3Nob3dFcnJvcjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2Vycm9yWm9uZS5oaWRkZW4gPSBmYWxzZTtcbiAgfSxcblxuICBfY29udHJvbENvbXBvc2VySW5wdXQ6IGZ1bmN0aW9uIChldnQpIHtcbiAgICB2YXIgaXNFbnRlciA9IGV2dC53aGljaCA9PT0gMTMgfHwgZXZ0LmtleUNvZGUgPT09IDEzO1xuICAgIGlmICghZXZ0LnNoaWZ0S2V5ICYmIGlzRW50ZXIpIHtcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5fc2VuZE1lc3NhZ2UoKTtcbiAgICB9XG4gIH0sXG5cbiAgX2dvVG9OZXdNZXNzYWdlczogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tKCk7XG4gICAgdGhpcy5faGlkZU5ld01lc3NhZ2VBbGVydCgpO1xuICB9LFxuXG4gIF91cGRhdGVDaGFyQ291bnRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciByZW1haW5pbmcgPSB0aGlzLm1heFRleHRMZW5ndGggLSB0aGlzLl9jb21wb3Nlci52YWx1ZS5sZW5ndGg7XG4gICAgdmFyIGlzVmFsaWQgPSByZW1haW5pbmcgPj0gMDtcbiAgICBpZiAoaXNWYWxpZCkge1xuICAgICAgdGhpcy5faGlkZVRvb0xvbmdUZXh0RXJyb3IoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLl9zaG93VG9vTG9uZ1RleHRFcnJvcigpO1xuICAgIH1cbiAgICB0aGlzLl9jaGFyQ291bnRlci50ZXh0Q29udGVudCA9IHJlbWFpbmluZztcbiAgfSxcblxuICBhZGRNZXNzYWdlOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIHZhciBzaG91bGRHcm91cCA9IHRoaXMuX3Nob3VsZEdyb3VwKG1lc3NhZ2UpO1xuICAgIHZhciBzaG91bGRTY3JvbGwgPSB0aGlzLl9zaG91bGRTY3JvbGwoKTtcbiAgICB0aGlzWyBzaG91bGRHcm91cCA/ICdfZ3JvdXBCdWJibGUnIDogJ19hZGROZXdCdWJibGUnIF0obWVzc2FnZSk7XG4gICAgaWYgKHNob3VsZFNjcm9sbCkge1xuICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLl9zaG93TmV3TWVzc2FnZUFsZXJ0KCk7XG4gICAgfVxuICAgIHRoaXMuX21lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAocmF3LCBpc0dyb3VwaW5nKSB7XG4gICAgcmV0dXJuIHJhdy5yZXBsYWNlKC8oXFxyXFxufFxccnxcXG4pL2csICc8YnIvPicpO1xuICB9LFxuXG4gIGVuYWJsZVNlbmRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9zZW5kQnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICB0aGlzLl9jb21wb3Nlci5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgdGhpcy5fY29tcG9zZXIuZm9jdXMoKTtcbiAgfSxcblxuICBkaXNhYmxlU2VuZGluZzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3NlbmRCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMuX2NvbXBvc2VyLmRpc2FibGVkID0gdHJ1ZTtcbiAgfSxcblxuICBfc2hvdWxkR3JvdXA6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgaWYgKHRoaXMuX2xhc3RNZXNzYWdlICYmIHRoaXMuX2xhc3RNZXNzYWdlLnNlbmRlcklkID09PSBtZXNzYWdlLnNlbmRlcklkKSB7XG4gICAgICB2YXIgcmVmZXJlbmNlID0gdGhpcy5fbGFzdE1lc3NhZ2UuZGF0ZVRpbWUuZ2V0VGltZSgpO1xuICAgICAgdmFyIG5ld0RhdGUgPSBtZXNzYWdlLmRhdGVUaW1lLmdldFRpbWUoKTtcbiAgICAgIHJldHVybiBuZXdEYXRlIC0gcmVmZXJlbmNlIDwgdGhpcy5ncm91cERlbGF5O1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgX3Nob3VsZFNjcm9sbDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9pc0F0Qm90dG9tKCk7XG4gIH0sXG5cbiAgX2lzQXRCb3R0b206IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYnViYmxlcyA9IHRoaXMuX2J1YmJsZXM7XG4gICAgcmV0dXJuIGJ1YmJsZXMuc2Nyb2xsSGVpZ2h0IC0gYnViYmxlcy5zY3JvbGxUb3AgPT09IGJ1YmJsZXMuY2xpZW50SGVpZ2h0O1xuICB9LFxuXG4gIF9zY3JvbGxUb0JvdHRvbTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2J1YmJsZXMuc2Nyb2xsVG9wID0gdGhpcy5fYnViYmxlcy5zY3JvbGxIZWlnaHQ7XG4gIH0sXG5cbiAgX2dyb3VwQnViYmxlOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIHZhciBjb250ZW50cyA9IHRoaXMucmVuZGVyKG1lc3NhZ2UudGV4dCwgdHJ1ZSk7XG4gICAgdGhpcy5fbGFzdEJ1YmJsZS5hcHBlbmRDaGlsZCh0aGlzLl9nZXRCdWJibGVDb250ZW50KGNvbnRlbnRzKSk7XG4gICAgdGhpcy5fbGFzdFRpbWVzdGFtcC50ZXh0Q29udGVudCA9IHRoaXMuaHVtYW5pemVEYXRlKG1lc3NhZ2UuZGF0ZVRpbWUpO1xuICB9LFxuXG4gIF9hZGROZXdCdWJibGU6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgdGhpcy5fYnViYmxlcy5hcHBlbmRDaGlsZCh0aGlzLl9nZXRCdWJibGUobWVzc2FnZSkpO1xuICB9LFxuXG4gIGdldCBfbGFzdE1lc3NhZ2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21lc3NhZ2VzW3RoaXMuX21lc3NhZ2VzLmxlbmd0aCAtIDFdO1xuICB9LFxuXG4gIGdldCBfbGFzdEJ1YmJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnViYmxlcy5sYXN0RWxlbWVudENoaWxkLnF1ZXJ5U2VsZWN0b3IoJ2RpdicpO1xuICB9LFxuXG4gIGdldCBfbGFzdFRpbWVzdGFtcCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYnViYmxlc1xuICAgICAgLmxhc3RFbGVtZW50Q2hpbGQucXVlcnlTZWxlY3RvcignLm90LW1lc3NhZ2UtdGltZXN0YW1wJyk7XG4gIH0sXG5cbiAgX2dldEJ1YmJsZUNvbnRlbnQ6IGZ1bmN0aW9uIChzYWZlSHRtbCkge1xuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdESVYnKTtcbiAgICBkaXYuY2xhc3NMaXN0LmFkZCgnb3QtYnViYmxlLWNvbnRlbnQnKTtcbiAgICBkaXYuaW5uZXJIVE1MID0gc2FmZUh0bWw7XG4gICAgcmV0dXJuIGRpdjtcbiAgfSxcblxuICBfZ2V0QnViYmxlOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIHZhciBidWJibGUgPSB0aGlzLl9idWJibGVUZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdmFyIHdyYXBwZXIgPSBidWJibGUucXVlcnlTZWxlY3RvcignZGl2Jyk7XG4gICAgdmFyIHNlbmRlciA9IHdyYXBwZXIucXVlcnlTZWxlY3RvcignLm90LW1lc3NhZ2Utc2VuZGVyJyk7XG4gICAgdmFyIHRpbWVzdGFtcCA9IHdyYXBwZXIucXVlcnlTZWxlY3RvcignLm90LW1lc3NhZ2UtdGltZXN0YW1wJyk7XG5cbiAgICAvLyBTZW5kZXIgJiBhbGlhc1xuICAgIGJ1YmJsZS5kYXRhc2V0LnNlbmRlcklkID0gbWVzc2FnZS5zZW5kZXJJZDtcbiAgICBpZiAobWVzc2FnZS5zZW5kZXJJZCA9PT0gdGhpcy5zZW5kZXJJZCkge1xuICAgICAgYnViYmxlLmNsYXNzTGlzdC5hZGQoJ21pbmUnKTtcbiAgICB9XG4gICAgc2VuZGVyLnRleHRDb250ZW50ID0gbWVzc2FnZS5zZW5kZXJBbGlhcztcblxuICAgIC8vIENvbnRlbnRcbiAgICB2YXIgY29udGVudHMgPSB0aGlzLnJlbmRlcihtZXNzYWdlLnRleHQsIGZhbHNlKTtcbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKHRoaXMuX2dldEJ1YmJsZUNvbnRlbnQoY29udGVudHMpKTtcblxuICAgIC8vIFRpbWVzdGFtcFxuICAgIHRpbWVzdGFtcC5kYXRlVGltZSA9IG1lc3NhZ2UuZGF0ZVRpbWUudG9JU09TdHJpbmcoKTtcbiAgICB0aW1lc3RhbXAudGV4dENvbnRlbnQgPSB0aGlzLmh1bWFuaXplRGF0ZShtZXNzYWdlLmRhdGVUaW1lKTtcblxuICAgIHJldHVybiBidWJibGU7XG4gIH0sXG5cbiAgaHVtYW5pemVEYXRlOiBmdW5jdGlvbiAoZGF0ZSkge1xuICAgIHZhciBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICB2YXIgaXNBTSA9IGhvdXJzIDwgMTI7XG4gICAgdmFyIGhvdXJzMTIgPSBob3VycyA+IDEyID8gaG91cnMgLSAxMiA6IGhvdXJzO1xuICAgIHZhciBtaW51dGVzID0gZGF0ZS5nZXRNaW51dGVzKCk7XG4gICAgbWludXRlcyA9IChtaW51dGVzIDwgMTAgPyAnMCcgOiAnJykgKyBtaW51dGVzO1xuICAgIHJldHVybiBob3VycyArICc6JyArIG1pbnV0ZXMgKyAoaXNBTSA/ICcgQU0nIDogJyBQTScpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBDaGF0TWVzc2FnZShzZW5kZXJJZCwgc2VuZGVyQWxpYXMsIHRleHQpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgIHNlbmRlcklkOiB7IHZhbHVlOiBzZW5kZXJJZCB9LFxuICAgIHNlbmRlckFsaWFzOiB7IHZhbHVlOiBzZW5kZXJBbGlhcyB9LFxuICAgIHRleHQ6IHsgdmFsdWU6IHRleHQgfSxcbiAgICBkYXRlVGltZTogeyB2YWx1ZTogbmV3IERhdGUoKSB9XG4gIH0pO1xufVxuXG5leHBvcnQgeyBDaGF0VUksIENoYXRNZXNzYWdlIH07XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBDaGF0IGZyb20gJy4vQ2hhdCc7XG5pbXBvcnQgeyBDaGF0VUksIENoYXRNZXNzYWdlIH0gZnJvbSAnLi9DaGF0VUknO1xuXG5mdW5jdGlvbiBDaGF0V2lkZ2V0KG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMuX2NoYXRCb3ggPSBuZXcgQ2hhdFVJKG9wdGlvbnMpO1xuICB0aGlzLl9jaGF0Qm94LmRpc2FibGVTZW5kaW5nKCk7XG4gIGlmIChvcHRpb25zLnNlc3Npb24pIHtcbiAgICB0aGlzLnN0YXJ0KG9wdGlvbnMpO1xuICB9XG59XG5cbkNoYXRXaWRnZXQucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogQ2hhdFdpZGdldCxcblxuICBzdGFydDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBpZiAoIXRoaXMuX2NoYXQpIHtcbiAgICAgIHRoaXMuX2NoYXQgPSBuZXcgQ2hhdChvcHRpb25zKTtcbiAgICAgIHRoaXMuX2NoYXQub25NZXNzYWdlUmVjZWl2ZWQgPSB0aGlzLm9uTWVzc2FnZVJlY2VpdmVkLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9jaGF0Qm94LnNlbmRlcklkID0gb3B0aW9ucy5zZXNzaW9uLmNvbm5lY3Rpb24uY29ubmVjdGlvbklkO1xuICAgICAgdGhpcy5fY2hhdEJveC5zZW5kZXJBbGlhcyA9IG9wdGlvbnMuc2Vzc2lvbi5jb25uZWN0aW9uLmRhdGE7XG4gICAgICB0aGlzLl9jaGF0Qm94Lm9uTWVzc2FnZVJlYWR5VG9TZW5kID0gdGhpcy5vbk1lc3NhZ2VSZWFkeVRvU2VuZC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fY2hhdEJveC5lbmFibGVTZW5kaW5nKCk7XG4gICAgfVxuICB9LFxuXG4gIG9uTWVzc2FnZVJlYWR5VG9TZW5kOiBmdW5jdGlvbiAoY29udGVudHMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5fY2hhdC5zZW5kKGNvbnRlbnRzLCBjYWxsYmFjayk7XG4gIH0sXG5cbiAgb25NZXNzYWdlUmVjZWl2ZWQ6IGZ1bmN0aW9uIChjb250ZW50cywgZnJvbSkge1xuICAgIHZhciBtZXNzYWdlID0gbmV3IENoYXRNZXNzYWdlKGZyb20uY29ubmVjdGlvbklkLCBmcm9tLmRhdGEsIGNvbnRlbnRzKTtcbiAgICB0aGlzLl9jaGF0Qm94LmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IENoYXRXaWRnZXQ7XG4iLCJcbmltcG9ydCBDaGF0IGZyb20gJy4vQ2hhdCc7XG5pbXBvcnQgeyBDaGF0VUksIENoYXRNZXNzYWdlIH0gZnJvbSAnLi9DaGF0VUknO1xuaW1wb3J0IENoYXRXaWRnZXQgZnJvbSAnLi9DaGF0V2lkZ2V0JztcblxuT1QuVGV4dENoYXQgPSB7XG4gIENoYXQ6IENoYXQsXG4gIENoYXRVSTogQ2hhdFVJLFxuICBDaGF0TWVzc2FnZTogQ2hhdE1lc3NhZ2UsXG4gIENoYXRXaWRnZXQ6IENoYXRXaWRnZXRcbn07XG4iXX0=
