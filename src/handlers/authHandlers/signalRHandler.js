// signalRHandler.js
import * as signalR from '@microsoft/signalr';

// Optional: Use an EventEmitter (Node.js built-in or you can write a basic one)
class signalRHandler {
  constructor(authService, hubUrl) {
    this.authService = authService;
    this.messageListeners = [];

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}/LogoutSignalR`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .build();

    this.hubConnection.on('logoutFromApp', (message) => {
      const auth = this.authService.getAuthFromLocalStorage();
      if (message === auth?.refreshToken) {
        this.authService.goToLogin();
      }

      // Notify all subscribers
      this.messageListeners.forEach((callback) => callback(message));
    });

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error:', err));
  }

  sendMessage(message) {
    this.hubConnection.invoke('SendMessage', message);
  }

  onMessage(callback) {
    this.messageListeners.push(callback);
  }
}

export default signalRHandler;
