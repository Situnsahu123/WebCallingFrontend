import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChatService } from './chat.service';
import Peer from 'simple-peer';

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private peer: any;
  private streamSource = new BehaviorSubject<MediaStream | null>(null);
  public stream$ = this.streamSource.asObservable();
  
  private remoteStreamSource = new BehaviorSubject<MediaStream | null>(null);
  public remoteStream$ = this.remoteStreamSource.asObservable();

  private callRequestSource = new Subject<any>();
  public callRequest$ = this.callRequestSource.asObservable();

  private outgoingCallSource = new Subject<any>();
  public outgoingCall$ = this.outgoingCallSource.asObservable();

  private callAcceptedSource = new Subject<void>();
  public callAccepted$ = this.callAcceptedSource.asObservable();

  private callRejectedSource = new Subject<void>();
  public callRejected$ = this.callRejectedSource.asObservable();

  private callEndedSource = new Subject<void>();
  public callEnded$ = this.callEndedSource.asObservable();

  // Keep track of current call settings
  public currentCallIsVideo: boolean = true;

  constructor(private chatService: ChatService) {
    const socket = this.chatService.getSocket();

    socket.on('callUser', (data) => {
      this.callRequestSource.next(data);
    });

    socket.on('callAccepted', (signal) => {
      this.callAcceptedSource.next();
      if (this.peer) {
        this.peer.signal(signal);
      }
    });

    socket.on('callRejected', () => {
      this.callRejectedSource.next();
      this.endCallLocally();
    });

    socket.on('callEnded', () => {
      this.callEndedSource.next();
      this.endCallLocally();
    });
  }

  async startCall(userToCallId: string, isVideo: boolean = true, userToCallName?: string) {
    this.currentCallIsVideo = isVideo;
    this.outgoingCallSource.next({ to: userToCallId, name: userToCallName || 'Unknown', isVideo });
    const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
    this.streamSource.next(stream);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    this.peer.on('signal', (data: any) => {
      this.chatService.getSocket().emit('callUser', {
        userToCall: userToCallId,
        signalData: data,
        from: user.id,
        name: user.username,
        isVideo: isVideo
      });
    });

    this.peer.on('stream', (remoteStream: any) => {
      this.remoteStreamSource.next(remoteStream);
    });
  }

  async answerCall(callerSignal: any, callerId: string, callId: string, isVideo: boolean = true) {
    this.currentCallIsVideo = isVideo;
    const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
    this.streamSource.next(stream);

    this.peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    this.peer.on('signal', (data: any) => {
      this.chatService.getSocket().emit('answerCall', { signal: data, to: callerId, callId: callId });
    });

    this.peer.on('stream', (remoteStream: any) => {
      this.remoteStreamSource.next(remoteStream);
    });

    this.peer.signal(callerSignal);
  }

  rejectCall(callerId: string, callId: string) {
    this.chatService.getSocket().emit('rejectCall', { to: callerId, callId: callId });
    this.endCallLocally();
  }

  endActiveCall(otherUserId: string) {
    this.chatService.getSocket().emit('endCall', { to: otherUserId });
    this.endCallLocally();
  }

  cancelOutgoingCall(userToCallId: string) {
    this.chatService.getSocket().emit('endCall', { to: userToCallId });
    this.endCallLocally();
  }

  endCallLocally() {
    if (this.peer) {
      this.peer.destroy();
    }
    const stream = this.streamSource.value;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    this.streamSource.next(null);
    this.remoteStreamSource.next(null);
  }
}
