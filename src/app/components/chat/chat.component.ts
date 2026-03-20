import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ChatService } from '../../services/chat.service';
import { CallService } from '../../services/call.service';
import { AuthService } from '../../services/auth.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarModule, ButtonModule, InputTextModule, TooltipModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnChanges, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  @Input() receiver: any;
  message: string = '';
  messages: any[] = [];
  currentUser: any;

  constructor(private chatService: ChatService, private callService: CallService, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser && this.receiver) {
        this.loadChatHistory();
      }
    });

    this.chatService.messages$.subscribe(msg => {
      console.log('ChatComponent: Received socket message:', msg);
      if (msg && this.receiver) {
        // Use string comparison for stability
        const isFromReceiver = String(msg.fromUserId) === String(this.receiver._id);
        const isToReceiver = String(msg.toUserId) === String(this.receiver._id);
        
        if (isFromReceiver || isToReceiver) {
          const normalizedMsg = {
            ...msg,
            message: msg.content || msg.message
          };
          this.messages.push(normalizedMsg);
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['receiver'] && this.receiver) {
      this.loadChatHistory();
    }
  }

  loadChatHistory() {
    if (!this.currentUser || !this.receiver) return;
    this.messages = [];
    this.chatService.getMessages(this.currentUser.id, this.receiver._id).subscribe({
      next: (msgs) => {
        this.messages = msgs.map(m => ({
          ...m,
          fromUserId: m.from,
          toUserId: m.to,
          message: m.content
        }));
      },
      error: (err) => console.error('ChatComponent: History load error:', err)
    });
  }

  sendMessage() {
    if (!this.message.trim() || !this.receiver) return;
    // Calling with exactly 2 arguments
    this.chatService.sendMessage(this.receiver._id, this.message);
    this.message = '';
  }

  startCall(isVideo: boolean) {
    if (!this.receiver) return;
    this.callService.startCall(this.receiver._id, isVideo, this.receiver.username);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
