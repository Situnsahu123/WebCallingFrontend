import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../header/header.component';
import { ChatComponent } from '../chat/chat.component';
import { CallComponent } from '../call/call.component';
import { AvatarModule } from 'primeng/avatar';
import { ListboxModule } from 'primeng/listbox';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { CallService } from '../../services/call.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ChatComponent, CallComponent, AvatarModule, ListboxModule, InputTextModule, FormsModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  calls: any[] = [];
  filteredCalls: any[] = [];
  currentTab: 'contacts' | 'calls' = 'contacts';
  searchQuery: string = '';
  selectedUser: any = null;
  currentUser: any = null;

  constructor(private http: HttpClient, private chatService: ChatService, private callService: CallService, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        this.fetchUsers();
        this.fetchCalls();
      }
    });
  }

  ngOnInit() {
    this.chatService.userStatus$.subscribe(update => {
      if (update) {
        const user = this.users.find(u => (u._id || u.id) === update.userId);
        if (user) user.status = update.status;
      }
    });

    this.callService.callEnded$.subscribe(() => {
        this.fetchCalls();
    });
    this.callService.callRejected$.subscribe(() => {
        this.fetchCalls();
    });
  }

  fetchUsers() {
    this.http.get<any[]>('https://webcallingbackend.onrender.com/api/users').subscribe({
      next: (users) => {
        const currentUserId = String(this.currentUser?.id || this.currentUser?._id || '');
        this.users = users.filter(u => String(u._id || u.id) !== currentUserId);
        this.filteredUsers = this.users;
        console.log('Dashboard: Loaded users:', this.users.length);
      },
      error: (err) => console.error('Dashboard: User fetch error:', err)
    });
  }

  fetchCalls() {
    if (!this.currentUser) return;
    const currentUserId = String(this.currentUser.id || this.currentUser._id || '');
    this.chatService.getCalls(currentUserId).subscribe({
      next: (calls) => {
        this.calls = calls;
        this.filteredCalls = calls;
      },
      error: (err) => console.error('Dashboard: Calls fetch error:', err)
    });
  }

  filterData() {
    if (this.currentTab === 'contacts') {
        this.filteredUsers = this.users.filter(u => 
          u.username.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
    } else {
        this.filteredCalls = this.calls.filter(c => {
          const otherUser = c.caller._id === this.currentUser.id ? c.receiver : c.caller;
          return otherUser.username.toLowerCase().includes(this.searchQuery.toLowerCase());
        });
    }
  }

  logout() {
    this.authService.logout();
  }
}
