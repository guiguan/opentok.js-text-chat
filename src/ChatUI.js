define(['ChatMessage'], function (ChatMessage) {
  'use strict';

  var uiLayout = [
    '<div class="ot-bubbles">',
    '</div>',
    '<div class="ot-input">',
    '  <div>',
    '    <p class="ot-error-zone" hidden>Error sending the message!</p>',
    '    <p class="ot-new-messages" hidden>▾&nbsp;New messages</p>',
    '    <textarea placeholder="Send a message&hellip;" class="ot-composer">' +
    '</textarea>',
    '    <div class="ot-bottom-line">',
    '      <p class="ot-character-counter"><span></span> characters left</p>',
    '      <button class="ot-send-button">Send&nbsp;⟩</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');

  var bubbleLayout = [
    '<div>',
    '  <header class="ot-bubble-header">',
    '    <p class="ot-message-sender"></p>',
    '    <time class="ot-message-timestamp"></time>',
    '  </header>',
    '</div>'
  ].join('\n');

  /**
   * User interface for a basic chat client.
   *
   * The UI display bubbles representing the chat activity in the conversation
   * area. An input area displays the remaining characters and allows to send
   * messages by hitting enter or clicking on the send button. To add a normal
   * break-line you can press the `shift + enter` combination.
   *
   * The conversation area groups messages separated no more than 2 minutes
   * (although this can be configured) and allow the user to review past
   * history even if receiving new messages.
   *
   * The chat UI can be placed inside any element by providing a `container`
   * and it will fill the container box.
   *
   * @class ChatUI
   * @constructor
   * @param {Object} [options] Hash with customizing properties.
   * @param {String} [options.container='body'] CSS selector representing the
   * container for the chat.
   * @param {String} [options.senderId] Unique id for this client. It defaults
   * in a random number.
   * @param {String} [options.senderAlias='me'] Alias to be displayed for this
   * client.
   * @param {Number} [options.maxTextLength=1000] Maximum length of the message.
   * @param {Number} [options.groupDelay=120000] Time in milliseconds to be
   * passed for the UI to separate the messages in different bubbles.
   * @param {Number} [options.timeout=5000] Time in milliseconds before
   * informing about a malfunction while sending the message.
   */
  function ChatUI(options) {
    options = options || {};
    this.senderId = options.senderId || ('' + Math.random()).substr(2);
    this.senderAlias = options.senderAlias || 'me';
    this.maxTextLength = options.maxTextLength || 1000;
    this.groupDelay = options.groupDelay || (2 * 60 * 1000); // 2 min
    this.timeout = options.timeout || 5000;
    this._watchScrollAtTheBottom = this._watchScrollAtTheBottom.bind(this);
    this._messages = [];
    this._setupTemplates();
    this._setupUI(options.container);
    this._updateCharCounter();
  }

  ChatUI.prototype = {
    constructor: ChatUI,

    _setupTemplates: function () {
      this._bubbleTemplate = document.createElement('section');
      this._bubbleTemplate.innerHTML = bubbleLayout;
      this._bubbleTemplate.classList.add('ot-bubble');
    },

    _setupUI: function (parent) {
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

    _watchScrollAtTheBottom: function () {
      if (this._isAtBottom()) {
        this._hideNewMessageAlert();
      }
    },

    _sendMessage: function () {
      var _this = this;
      var contents = this._composer.value;

      if (contents.length > _this.maxTextLength) {
        _this._showTooLongTextError();
      }
      else {
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
            }
            else {
              _this.addMessage(new ChatMessage(
                _this.senderId,
                _this.senderAlias,
                contents
              ));
              _this._composer.value = '';
              _this._updateCharCounter();
              _this._hideErrors();
            }
            _this.enableSending();
          });

        }
      }
    },

    _showTooLongTextError: function () {
      this._charCounter.parentElement.classList.add('error');
    },

    _hideTooLongTextError: function () {
      this._charCounter.parentElement.classList.remove('error');
    },

    _showNewMessageAlert: function () {
      this._newMessages.removeAttribute('hidden');
    },

    _hideNewMessageAlert: function () {
      this._newMessages.hidden = true;
    },

    _showError: function () {
      this._errorZone.hidden = false;
    },

    _hideErrors: function () {
      this._errorZone.hidden = true;
      this._hideTooLongTextError();
    },

    _controlComposerInput: function (evt) {
      var isEnter = evt.which === 13 || evt.keyCode === 13;
      if (!evt.shiftKey && isEnter) {
        evt.preventDefault();
        this._sendMessage();
      }
    },

    _goToNewMessages: function () {
      this._scrollToBottom();
      this._hideNewMessageAlert();
    },

    _updateCharCounter: function () {
      var remaining = this.maxTextLength - this._composer.value.length;
      var isValid = remaining >= 0;
      if (isValid) {
        this._hideTooLongTextError();
      }
      else {
        this._showTooLongTextError();
      }
      this._charCounter.textContent = remaining;
    },

    /**
     * Adds a message to the conversation.
     *
     * @method addMessage
     * @param {ChatMessage} message The message to be displayed.
     */
    addMessage: function (message) {
      var shouldGroup = this._shouldGroup(message);
      var shouldScroll = this._shouldScroll();
      this[ shouldGroup ? '_groupBubble' : '_addNewBubble' ](message);
      if (shouldScroll) {
        this._scrollToBottom();
      }
      else {
        this._showNewMessageAlert();
      }
      this._messages.push(message);
    },

    /**
     * Transform the message before displaying it in the conversation. The
     * result of this method is considered safe html so be careful and take
     * care.
     *
     * @method renderMessage
     * @param {String} raw Original contents recovered from the message.
     * @param {Boolean} isGrouping If `true` the content will be merged with
     * the previous bubble.
     * @return {String} Valid HTML to be displayed in the conversation.
     */
    renderMessage: function (raw, isGrouping) {
      return raw;
    },

    /**
     * Enable input area and sending button.
     *
     * @method enableSending
     */
    enableSending: function () {
      this._sendButton.removeAttribute('disabled');
      this._composer.removeAttribute('disabled');
      this._composer.focus();
    },

    /**
     * Disable input area and sending button.
     *
     * @method disableSending
     */
    disableSending: function () {
      this._sendButton.disabled = true;
      this._composer.disabled = true;
    },

    _shouldGroup: function (message) {
      if (this._lastMessage && this._lastMessage.senderId === message.senderId) {
        var reference = this._lastMessage.dateTime.getTime();
        var newDate = message.dateTime.getTime();
        return newDate - reference < this.groupDelay;
      }
      return false;
    },

    _shouldScroll: function () {
      return this._isAtBottom();
    },

    _isAtBottom: function () {
      var bubbles = this._bubbles;
      return bubbles.scrollHeight - bubbles.scrollTop === bubbles.clientHeight;
    },

    _scrollToBottom: function () {
      this._bubbles.scrollTop = this._bubbles.scrollHeight;
    },

    _groupBubble: function (message) {
      var contents = this.renderMessage(message.text, true);
      this._lastBubble.appendChild(this._getBubbleContent(contents));
      this._lastTimestamp.textContent = this.humanizeDate(message.dateTime);
    },

    _addNewBubble: function (message) {
      this._bubbles.appendChild(this._getBubble(message));
    },

    get _lastMessage() {
      return this._messages[this._messages.length - 1];
    },

    get _lastBubble() {
      return this._bubbles.lastElementChild.querySelector('div');
    },

    get _lastTimestamp() {
      return this._bubbles
        .lastElementChild.querySelector('.ot-message-timestamp');
    },

    _getBubbleContent: function (safeHtml) {
      var div = document.createElement('DIV');
      div.classList.add('ot-message-content');
      div.innerHTML = safeHtml;
      return div;
    },

    _getBubble: function (message) {
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

    /**
     * Called when displaying a message to human format the date.
     *
     * @method humanizeDate
     * @param {Date} date The date from the message.
     * @return {String} Human friendly representation for the passed date.
     */
    humanizeDate: function (date) {
      var hours = date.getHours();
      var isAM = hours < 12;
      var hours12 = hours > 12 ? hours - 12 : hours;
      var minutes = date.getMinutes();
      minutes = (minutes < 10 ? '0' : '') + minutes;
      return hours + ':' + minutes + (isAM ? ' AM' : ' PM');
    }
  };

  return ChatUI;
});
