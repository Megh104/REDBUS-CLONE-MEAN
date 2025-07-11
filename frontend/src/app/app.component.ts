import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  loading: boolean = false;
  errorMessage: string = '';
  currentLang: string = 'en';

  constructor(private translate: TranslateService) {
    // Initialize translations
    translate.addLangs(['en', 'hi']);
    translate.setDefaultLang('en');

    // Get stored language preference or browser language
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang && ['en', 'hi'].includes(storedLang)) {
      this.currentLang = storedLang;
      translate.use(storedLang);
    } else {
      const browserLang = translate.getBrowserLang();
      this.currentLang = browserLang?.match(/en|hi/) ? browserLang : 'en';
      translate.use(this.currentLang);
      localStorage.setItem('preferredLanguage', this.currentLang);
    }

    // Set initial HTML lang attribute
    document.documentElement.lang = this.currentLang;
  }

  ngOnInit() {
    // Subscribe to language changes
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      document.documentElement.lang = event.lang;
      
      // Update font family based on language
      if (event.lang === 'hi') {
        document.body.style.fontFamily = "'Noto Sans Devanagari', sans-serif";
      } else {
        document.body.style.fontFamily = "'Roboto', sans-serif";
      }
    });

    // Set initial font family
    if (this.currentLang === 'hi') {
      document.body.style.fontFamily = "'Noto Sans Devanagari', sans-serif";
    } else {
      document.body.style.fontFamily = "'Roboto', sans-serif";
    }
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    this.currentLang = lang;
  }
}
