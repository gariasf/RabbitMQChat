import { h, Component } from 'preact';
import { bind } from 'decko';
import Ink from 'react-ink';

var Stomp = require('stompjs/lib/stomp.js').Stomp;

import style from './styles.scss';

export default class Chat extends Component {
  constructor(props) {
    super(props);

    this.userChatId = this.props.match.params.userChatId;
    this.rabbitClient = null;
    this.state = {
      messageList: [],
      userMessage: null
    };
  }

  componentDidMount() {
    this.createRabbitConnection();
  }

  createRabbitConnection() {
    var ws = new WebSocket('ws://localhost:15674/ws');
    this.rabbitClient = Stomp.over(ws);

    this.rabbitClient.connect(
      'guest',
      'guest',
      this.onRabbitConnect,
      this.onRabbitConnectionError,
      '/'
    );
  }

  subscribeToRabbitExchange(exchangeName) {
    this.rabbitClient.subscribe(exchangeName, response => {
      const newMessage = JSON.parse(response.body);

      const newMessageArray = [...this.state.messageList];
      newMessageArray.push(newMessage);
      this.setState({ messageList: newMessageArray });
    });
  }

  @bind
  onRabbitConnect() {
    this.subscribeToRabbitExchange('/exchange/chat-exchange');
  }

  @bind
  onRabbitConnectionError() {
    console.error('Error connecting');
  }

  @bind
  sendMessage(event) {
    event.preventDefault();

    if (!this.state.userMessage) {
      window.alert('You must write a message');
    } else {
      this.rabbitClient.send(
        '/exchange/chat-exchange',
        { 'content-type': 'text/plain' },
        JSON.stringify({
          userName: this.userChatId,
          content: this.state.userMessage
        })
      );
    }
  }

  @bind
  renderMessageList() {
    return this.state.messageList.map(message => {
      return (
        <span>
          <strong>{message.userName}</strong>: {message.content}
        </span>
      );
    });
  }

  @bind
  onUserMessageInput(event) {
    const newMessge = event.target.value;

    this.setState({ userMessage: newMessge });
  }

  render() {
    return (
      <div class={`flex flex-dc ${style.chatWrapper}`}>
        <div class={`flex flex-dc ${style.messagesWrapper}`}>
          {this.renderMessageList()}
        </div>
        <form
          onSubmit={this.sendMessage}
          class={`flex ${style.userActionWrapper}`}
        >
          <textarea
            onInput={this.onUserMessageInput}
            placeholder="Type your message..."
          />
          <button onClick={this.sendMessage}>
            <Ink />
            Send Mesage
          </button>
        </form>
      </div>
    );
  }
}
