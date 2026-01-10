import { ApplicationConfig } from '@angular/core';  
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideA2UI, DEFAULT_CATALOG } from '@a2ui/angular';  
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';  
import { theme } from './theme';
import { a2aInterceptor } from './a2a.interceptor';  
  
export const appConfig: ApplicationConfig = {  
  providers: [  
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([a2aInterceptor])),
    provideA2UI({  
      catalog: DEFAULT_CATALOG,  
      theme: theme,  
    }),  
  ],  
};