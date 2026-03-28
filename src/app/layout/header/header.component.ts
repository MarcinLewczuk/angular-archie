import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkWithHref } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/AuthService';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkWithHref, CommonModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }
}