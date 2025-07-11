import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../service/customer.service';

declare var google: any;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  showLanguageMenu: boolean = false;
  isloggedIn: boolean = false;
  currentLang: string = 'en';

  constructor(
    private router: Router,
    private customerservice: CustomerService,
    private translate: TranslateService
  ) {
    this.currentLang = translate.currentLang || localStorage.getItem('preferredLanguage') || 'en';
  }

ngOnInit(): void {
    if (sessionStorage.getItem("Loggedinuser")) {
      this.isloggedIn = true;
    } else {
      this.isloggedIn = false;
    }

    // Initialize Google Sign-in when the script is loaded
    this.initializeGoogleSignIn();

    // Subscribe to language changes
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      document.documentElement.lang = event.lang;
    });
  }

  private initializeGoogleSignIn() {
    const checkGoogleScript = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogleScript);
        google.accounts.id.initialize({
          client_id: "1035353242266-0m8ak8l0dfmjv75374jq792iog02tpn7.apps.googleusercontent.com",
          callback: (response: any) => { this.handlelogin(response); }
        });
        this.rendergooglebutton();
      }
    }, 100);
  }

  toggleLanguageMenu() {
    this.showLanguageMenu = !this.showLanguageMenu;
  }

  switchLanguage(lang: string) {
    this.translate.use(lang).subscribe(() => {
      this.currentLang = lang;
      localStorage.setItem('preferredLanguage', lang);
      document.documentElement.lang = lang;
      this.showLanguageMenu = false;
    });
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  handlelogin(response: any) {
    if (response && response.credential) {
      const payload = this.decodetoken(response.credential);
  this.customerservice.addcustomermongo(payload).subscribe({
        next: (response) => {
          console.log('POST success', response);
          sessionStorage.setItem("Loggedinuser", JSON.stringify(response));
          window.location.reload();
    },
        error: (error) => {
          console.error('Post request failed', error);
    }
      });
}
  }

  private decodetoken(token: string) {
    return JSON.parse(atob(token.split(".")[1]));
  }

  handlelogout() {
    if (typeof google !== 'undefined' && google.accounts) {
  google.accounts.id.disableAutoSelect();
    }
  sessionStorage.removeItem('Loggedinuser');
    window.location.reload();
}

  ngAfterViewInit(): void {
    // Removed rendergooglebutton call from here as it's now handled in initializeGoogleSignIn
  }

  private rendergooglebutton(): void {
    const googlebtn = document.getElementById('google-btn');
    if (googlebtn && typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.renderButton(googlebtn, {
        theme: 'outline',
        size: 'medium',
        shape: 'pill',
        width: 150,
        text: 'signin_with'
      });
    }
}
}
