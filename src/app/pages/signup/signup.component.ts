import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import EmailValidation from '../../validators/email.validator';
import { AuthService } from '../../services/AuthService';
import { SnackbarService } from '../../services/SnackbarService';
import PasswordValidation from '../../validators/password.validator';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
})

export class SignupComponent {
  emailControl = new FormControl('');
  passwordControl = new FormControl('');
  confirmPasswordControl = new FormControl('');
  r = inject(Router)
  http = inject(HttpClient)
  auth = inject(AuthService)
  snackbar = inject(SnackbarService)
  fb = inject(FormBuilder)

  existingEmails: any[] =[]
  existingEmails$ = of(this.existingEmails);

  signupForm = new FormGroup({
    email: this.emailControl,
    password: this.passwordControl,
    confirmPassword: this.confirmPasswordControl
  });

  constructor() {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, EmailValidation.emailFormat], EmailValidation.emailTaken(this.http)],
      password: ['', [Validators.required, PasswordValidation.passwordStrength]],
      confirmPassword: ['', [Validators.required, PasswordValidation.matchPassword]]
    })
  }

  ngOnInit():void {
    this.emailControl = this.signupForm.get('email') as FormControl;
    this.passwordControl = this.signupForm.get('password') as FormControl;
    this.confirmPasswordControl = this.signupForm.get('confirmPassword') as FormControl;
  }

onSubmit() {
  // Fail
  if (this.signupForm.invalid) {
    if (this.emailControl.hasError('emailTaken')) {
      this.snackbar.error('Email is already taken');
    } else {
      this.snackbar.error('Please fill in all fields correctly');
    }
    return;
  }

  const { email, password } = this.signupForm.value;
  this.auth.signup(email!, password!).subscribe({
    next: () => {
      this.snackbar.success('Sign up successful!');
      this.auth.login(email!, password!).subscribe({
        next: () => {
          this.r.navigate(['/']);
        }
      });
    },
    error: (err) => {
      if (err.status === 409 || err.error?.error?.includes('Duplicate')) {
        this.snackbar.error('Email is already taken');
      } else {
        this.snackbar.error('Sign up failed. Please try again.');
      }
    }
  });
  }
}
