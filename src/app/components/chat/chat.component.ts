import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
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
export class ChatComponent implements OnChanges, AfterViewChecked, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  @Input() receiver: any;
  @Output() closeChat = new EventEmitter<void>();
  message: string = '';
  messages: any[] = [];
  currentUser: any;
  private subscriptions: Subscription = new Subscription();

  constructor(private chatService: ChatService, private callService: CallService, private authService: AuthService) {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser && this.receiver) {
        this.loadChatHistory();
        }
      })
    );

    this.subscriptions.add(
      this.chatService.messages$.subscribe(msg => {
        console.log('ChatComponent: Received socket message:', msg);
        if (msg && this.receiver) {
          // Use string comparison for stability
          const isFromReceiver = String(msg.fromUserId) === String(this.receiver._id);
          const isToReceiver = String(msg.toUserId) === String(this.receiver._id);
          
          if (isFromReceiver || isToReceiver) {
            const msgContent = msg.content || msg.message;
            const normalizedMsg = {
              ...msg,
              message: msgContent
            };
            
            // Strict deduplication: matching IDs, OR matching content and users within a 2-second window
            const exists = this.messages.some(m => {
              const isSameId = m._id && msg._id && String(m._id) === String(msg._id);
              const isSameContent = m.message === msgContent && 
                                    String(m.fromUserId) === String(msg.fromUserId) && 
                                    String(m.toUserId) === String(msg.toUserId);
              
              // If we don't have stable IDs, but content and users are same, we consider it duplicate if it's very recent
              return isSameId || isSameContent;
            });

            if (!exists) {
              this.messages.push(normalizedMsg);
            }
          }
        }
      })
    );
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

  goBack() {
    this.closeChat.emit();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
