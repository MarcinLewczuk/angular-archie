import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { WorkoutsComponent } from './pages/workouts/workouts.component';
import { WorkoutDetailComponent } from './pages/workouts/workout-detail/workout-detail.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        title: 'Home'
    },
    {
        path: 'login',
        component: LoginComponent,
        title: 'Login'
    },
    {
        path: 'signup',
        component: SignupComponent,
        title: 'Signup'
    },
    {
        path: 'workouts',
        component: WorkoutsComponent,
        title: 'Workouts'
    },
    {
        path: 'workouts/detail',
        component: WorkoutDetailComponent,
        title: 'Workout Detail'
    }
];
