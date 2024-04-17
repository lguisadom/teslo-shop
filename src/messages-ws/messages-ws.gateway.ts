import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService
  ) { }

  handleConnection(client: Socket) {
    const token: string = client.handshake.headers.authentication as string;
    console.log({ token });
    this.messagesWsService.registerClient(client);

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  handleDisconnect(client: Socket) {
    // console.log('Client disconnected: ', client.id);
    this.messagesWsService.removeClient(client.id);

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    console.log(client.id, payload);

    // Send message to the same client
    // client.emit('message-from-server', { 
    //   fullName: 'Soy yo!', 
    //   message: payload.message || 'no-message!!'
    // });

    // Send message to everyone except the client who sent the message
    // client.broadcast.emit('message-from-server', {
    //   fullName: 'Soy yo!', 
    //   message: payload.message || 'no-message!!'
    // });

    // Send message to everyone
    this.wss.emit('message-from-server', {
      fullName: 'Soy yo!',
      message: payload.message || 'no-message!!'
    });
  }
}
