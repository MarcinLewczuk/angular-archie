import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { SnackbarService } from '../../services/SnackbarService';
import EmailValidation from '../../validators/email.validator';
import { inject } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  emailControl = new FormControl('');
  passwordControl = new FormControl('');

  http = inject(HttpClient)
  auth = inject(AuthService)
  snackbar = inject(SnackbarService)
  router = inject(Router)
  fb = inject(FormBuilder)
  
  loginForm: FormGroup;
  
  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, EmailValidation.emailFormat]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.emailControl = this.loginForm.get('email') as FormControl;
    this.passwordControl = this.loginForm.get('password') as FormControl;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.snackbar.error('Please fill in all fields correctly');
      return;
    }

    const { email, password } = this.loginForm.value;
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.snackbar.success('Login successful!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        if (err.status === 401) {
          this.snackbar.error('Invalid email or password');
        } else {
          this.snackbar.error('Login failed. Please try again.');
        }
      }
    });
  }
}