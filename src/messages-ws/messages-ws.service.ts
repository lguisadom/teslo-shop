import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { User } from 'src/auth/entities/user.entity';

import { Repository } from 'typeorm';

interface ConnectedClients {
  [id: string]: {
    socket: Socket,
    user: User
  }
};

@Injectable()
export class MessagesWsService {
  private connectedClients: ConnectedClients = {};

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  async registerClient(client: Socket, userId: string) {
    
    const user: User = await this.userRepository.findOneBy({id: userId});

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("User inactive");
    }

    this.connectedClients[client.id] = {
      socket: client,
      user
    };
  }

  removeClient(clientId: string) {
    delete this.connectedClients[clientId];
  }

  getConnectedClients(): string[] {
    // console.log(this.connectedClients);
    return Object.keys(this.connectedClients);
  }

  getUserFullNameBySocketId(socketId: string): string {
    return this.connectedClients[socketId].user.fullName;
  }
}

