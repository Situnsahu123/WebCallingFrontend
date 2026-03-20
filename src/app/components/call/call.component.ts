import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallService } from '../../services/call.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, AvatarModule],
  templateUrl: './call.component.html',
  styleUrl: './call.component.css'
})
export class CallComponent implements OnInit {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  receivingCall: boolean = false;
  callingOut: boolean = false;
  otherUserId: string = '';
  otherUserName: string = '';
  callerSignal: any = null;
  callAccepted: boolean = false;
  visible: boolean = false;
  callId: string = '';
  isVideo: boolean = true;
  isMuted: boolean = false;
  isCameraOff: boolean = false;

  // Store streams so we can re-attach after Angular renders the DOM
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  constructor(private callService: CallService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.callService.callRequest$.subscribe(data => {
      this.receivingCall = true;
      this.otherUserId = data.from;
      this.otherUserName = data.name || data.from;
      this.callerSignal = data.signal;
      this.callId = data.callId;
      this.isVideo = data.isVideo !== false;
      this.visible = true;
    });

    this.callService.outgoingCall$.subscribe(data => {
      this.callingOut = true;
      this.receivingCall = false;
      this.otherUserId = data.to;
      this.otherUserName = data.name;
      this.isVideo = data.isVideo !== false;
      this.visible = true;
    });

    // Store local stream — attach when DOM is ready
    this.callService.stream$.subscribe(stream => {
      this.localStream = stream;
      this.attachStreams();
    });

    // Store remote stream — attach when DOM is ready
    this.callService.remoteStream$.subscribe(stream => {
      console.log('CallComponent: Received remote stream', !!stream);
      this.remoteStream = stream;
      // Give Angular a moment to render the fullscreen overlay
      setTimeout(() => this.attachStreams(), 50);
    });

    this.callService.callAccepted$.subscribe(() => {
      this.callAccepted = true;
      this.receivingCall = false;
      this.callingOut = false;
      // Wait for Angular to render the video elements inside the overlay
      setTimeout(() => this.attachStreams(), 100);
    });

    this.callService.callRejected$.subscribe(() => {
      this.endCallLocally();
    });

    this.callService.callEnded$.subscribe(() => {
      this.endCallLocally();
    });
  }

  /** Attaches stored streams to video elements whenever they exist in the DOM */
  private attachStreams() {
    if (this.localStream && this.localVideo?.nativeElement) {
      this.localVideo.nativeElement.srcObject = this.localStream;
      this.localVideo.nativeElement.play().catch(() => {});
    }
    if (this.remoteStream && this.remoteVideo?.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = this.remoteStream;
      this.remoteVideo.nativeElement.play().catch(() => {});
    }
  }

  answerCall() {
    this.callAccepted = true;
    this.receivingCall = false;
    this.callService.answerCall(this.callerSignal, this.otherUserId, this.callId, this.isVideo);
    // Give Angular time to render the video overlay before attaching streams
    setTimeout(() => this.attachStreams(), 100);
  }

  endCall() {
    if (this.receivingCall) {
      this.callService.rejectCall(this.otherUserId, this.callId);
    } else if (this.callingOut && !this.callAccepted) {
      this.callService.cancelOutgoingCall(this.otherUserId);
    } else if (this.callAccepted) {
      this.callService.endActiveCall(this.otherUserId);
    } else {
      this.callService.endCallLocally();
    }
    this.endCallLocally();
  }

  endCallLocally() {
    this.callService.endCallLocally();
    this.visible = false;
    this.receivingCall = false;
    this.callingOut = false;
    this.callAccepted = false;
    this.otherUserId = '';
    this.otherUserName = '';
    this.callerSignal = null;
    this.callId = '';
    this.isMuted = false;
    this.isCameraOff = false;
    this.localStream = null;
    this.remoteStream = null;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => t.enabled = !this.isMuted);
    }
  }

  toggleCamera() {
    this.isCameraOff = !this.isCameraOff;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => t.enabled = !this.isCameraOff);
    }
  }
}
