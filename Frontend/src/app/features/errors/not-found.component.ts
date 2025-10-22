import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <section class="container" style="padding:2rem; text-align:center">
      <h1>404 - Not Found</h1>
      <p>The page you are looking for doesn't exist.</p>
      <a routerLink="/">Go to Home</a>
    </section>
  `
})
export class NotFoundComponent {}
