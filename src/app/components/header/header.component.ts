import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  template: `
    <header class="hdr-bar">
      <div class="hdr-logo" routerLink="/">
        <div class="hdr-logo-icon">
          <i class="pi pi-video"></i>
        </div>
        <span class="hdr-logo-name">WebCalling</span>
      </div>

      <div class="hdr-user" *ngIf="user">
        <div class="hdr-user-badge">
          <span class="hdr-user-avatar">{{user.username?.charAt(0)?.toUpperCase()}}</span>
          <div class="hdr-user-info">
            <span class="hdr-username">{{user.username}}</span>
            <div class="hdr-online-badge">
              <span class="hdr-dot"></span>
              <span>Online</span>
            </div>
          </div>
        </div>
        <button class="hdr-signout-btn" (click)="logout()">
          <i class="pi pi-power-off"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; z-index: 100; position: relative; }
    .hdr-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      height: 60px;
      background: rgba(6, 9, 18, 0.85);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      position: relative;
    }
    .hdr-bar::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(129,140,248,0.3), transparent);
    }
    .hdr-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;
    }
    .hdr-logo-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, #818cf8, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      color: white;
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);
    }
    .hdr-logo-name {
      font-family: 'Outfit', 'Inter', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      background: linear-gradient(135deg, #818cf8, #e879f9);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.4px;
    }
    .hdr-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .hdr-user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 12px 5px 6px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 40px;
    }
    .hdr-user-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #818cf8, #e879f9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }
    .hdr-user-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .hdr-username {
      font-size: 0.82rem;
      font-weight: 600;
      color: #e2e8f0;
      letter-spacing: 0.1px;
    }
    .hdr-online-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.68rem;
      color: #10b981;
      font-weight: 500;
    }
    .hdr-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 5px rgba(16,185,129,0.7);
      display: inline-block;
    }
    .hdr-signout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: transparent;
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 8px;
      color: #ef4444;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Inter', sans-serif;
    }
    .hdr-signout-btn:hover {
      background: rgba(239,68,68,0.08);
      border-color: rgba(239,68,68,0.4);
    }
  `]
})
export class HeaderComponent implements OnInit {
  user: any;
  constructor(private authService: AuthService) {}
  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.user = u);
  }
  logout() {
    this.authService.logout();
  }
}
