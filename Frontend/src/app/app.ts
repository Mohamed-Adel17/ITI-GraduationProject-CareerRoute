import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { NotificationComponent } from './shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationComponent, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Frontend');
}

// import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import { provideRouter } from '@angular/router';
// import { bootstrapApplication } from '@angular/platform-browser';
// import { importProvidersFrom } from '@angular/core';
// import { LoginComponent } from './pages/login/login';
// import { Routes } from '@angular/router';

// const routes: Routes = [
//   { path: '', redirectTo: 'login', pathMatch: 'full' },
//   { path: 'login', component: LoginComponent },
//   { path: '**', redirectTo: 'login' }
// ];

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [RouterOutlet],
//   template: `<router-outlet></router-outlet>`
// })
// export class AppComponent {}

// // ✅ bootstrap التطبيق مع الراوتس
// bootstrapApplication(AppComponent, {
//   providers: [
//     provideRouter(routes),
//   ],
// });
