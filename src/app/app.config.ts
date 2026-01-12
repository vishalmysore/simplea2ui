import { ApplicationConfig } from '@angular/core';  
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideA2UI, DEFAULT_CATALOG } from '@a2ui/angular';  
import { theme } from './theme';
import { a2aInterceptor } from './a2a.interceptor';
import { GraphComponent } from './graph.component';
  
export const appConfig: ApplicationConfig = {  
providers: [  
    provideHttpClient(withInterceptors([a2aInterceptor])),
    provideA2UI({  
      catalog: {
        ...DEFAULT_CATALOG,
        Graph: () => import('./graph.component').then(m => m.GraphComponent)
      },
      theme: theme,
    }),  
  ],  
};