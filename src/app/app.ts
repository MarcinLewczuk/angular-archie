import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { AuthService } from './services/AuthService';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  auth = inject(AuthService);

  ngOnInit() {
    // Restore auth from localStorage on app initialization
    this.auth.restore();
  }
}
