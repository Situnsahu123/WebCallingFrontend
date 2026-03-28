import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private messageSubject = new BehaviorSubject<any>(null);
  public messages$ = this.messageSubject.asObservable();
  
  private userStatusSubject = new BehaviorSubject<any>(null);
  public userStatus$ = this.userStatusSubject.asObservable();

  constructor(private authService: AuthService, private http: HttpClient) {
    this.socket = io('https://webcallingbackend.onrender.com');
    
    this.socket.on('connect', () => {
      console.log('ChatService: Socket connected:', this.socket.id);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        this.socket.emit('join', user.id);
      }
    });

    this.authService.currentUser$.subscribe(user => {
      if (user && this.socket.connected) {
        this.socket.emit('join', user.id);
      }
    });

    this.socket.on('receiveMessage', (data) => {
      this.messageSubject.next(data);
    });

    this.socket.on('userStatusUpdate', (data) => {
      this.userStatusSubject.next(data);
    });
  }

  sendMessage(toUserId: string, message: string) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const data = {
      toUserId,
      message,
      fromUserId: user.id,
      fromUserName: user.username
    };
    this.socket.emit('sendMessage', data);
  }

  getMessages(userId1: string, userId2: string): Observable<any[]> {
    return this.http.get<any[]>(`https://webcallingbackend.onrender.com/api/messages/${userId1}/${userId2}`);
  }

  getCalls(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`https://webcallingbackend.onrender.com/api/calls/${userId}`);
  }

  getSocket() {
    return this.socket;
  }
}
