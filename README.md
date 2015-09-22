# OpenTok TextChat

OpenTok TextChat is a component for OpenTok to provide both a library and basic web UI to implement text chat capabilities in your application.

## Installation

```
$ bower install opentok-textchat
```

## Express UI setup

To setup the chat, you simply have a container for the chat:

```html
<section id="chat"></section>
```

And use this JavaScript to add a chat box:

```js
var chat = new OT.TextChat.ChatBox({
  session: session
  container: '#chat'
});
```

_Would you like to know more?_ Omit the next section and [jump directly to the customization part](#chatbox-customization).

## Using the library

A chat is tied to a session and you always broadcast your message to all the participants (clients) connected to that session. In a similar way you will receive the messages from all other participants.

### Creating the chat

To link a chat with a session you use:

```js
var chat = new OT.TextChat.Chat({ session: session });
```

The `session` parameter is mandatory, not passing a `session` object results in a runtime exception.

The local client is represented by the `Chat#sender` property. 

You can set a _name_ for youself while creating the chat, simply do:

```js
var chat = new OT.TextChat.Chat({ session: session, name: 'Bill' });
```

Each participant has **an identity** which must be a string identifying the participant univoquely inside the session. It's automatically set with the connection id got from the session object but you can change when creating the chat:

```js
var chat = new OT.TextChat.Chat({ session: session, senderId: '1234' });
```

### Setup participant information

If you want to change your information after the chat has been created, you can use the **me** participant:

```js
chat.participants.me.name = 'William';
chat.participants.me.senderId = 'ABC';
```

Apart from its name and id, a participant can have any other information stored in _attributes_. These attributes can be get or set with `Participant#get()` and `Participant#set()` methods:

```js
chat.participants.me.set('status', 'Hacking with OpenTok!');
```

```js
chat.participants.forEach(function (participant) {
  console.log(participant.name, 'is', participant.get('status');
});
```

### Sending a message

Use the `Chat#send()` method to publish a message in the chat:

```js
chat.send('Hi folks!')
```

### Receiving messages

Use `.on('message', callback)` to attach a listener to the `message` event:

```js
chat.on('message', function (msg) {
  console.log(msg.from.name, '(id: ' + msg.senderId + ') says:', msg.text);
});
```

### Receiving participants' attribute changes

In a similar way, use `Chat#on('attributeChange', callback)` to be notified when an attribute from a participant changes:

```js
chat.on('attributeChange', function (evt) {
  console.log(evt.from.name, 'changed its', evt.attrName, 'to', evt.attrValue);
});
```

You can inspect `evt.attrOldValue` to get the old value of the attribute. Notice changes in _name_ and _senderId_ are notified in the same way.

## ChatBox customization

Subclassing `ChatBox` you can customize `ChatBox` behaviour:

```js
function MyChatBox(options) {
  ChatBox.apply(this, arguments);
}
MyChatBox.prototype = Object.create(ChatBox.prototype);
MyChatBox.prototype.constructor = MyChatBox;
```

When receiving or sending messages, `onMessageReceived()` and `onMessageReadyToSend()` methods are invoked on the object set by `setTextChatListener()` method. The `ChatBox` class already define these methods and call `setTextChatListener()` upon itself in the constructor. It configures the maximum length of the message and the sender information such as the sender id and the name of the client.

```js
var chatbox = new MyChatBox();
chatbox.setTextChatListener(chatbox);
chatbox.setM
```


```js
MyChatBox.prototype.onMessageReadyToSend = function (msg) {
  var text = msg.getText();
  if (text.length > this._maxLength) {
    throw new Error('Text is too long');
  }
  retur this._send(text);
};

var chatbox = new MyChatBox();
chatbox.setSender  
```

Whe receiving text, `onMessageReceived()` method is called on the object set by `setTextChatListener()` as well. Overwrite this to process the message before showing, create a and use `addMessage()` method to display the message.

You can find the complete `ChatBox` class documentation here.
