import { Platform } from 'react-native';

// Extend XMLHttpRequest interface for debugging
declare global {
  interface XMLHttpRequest {
    _method?: string;
    _url?: string;
    _requestHeaders?: Record<string, string>;
    _startTime?: number;
    _data?: any;
  }
  
  var global: any;
}

// Network interceptor for debugging
if (__DEV__) {
  // XMLHttpRequest interceptor
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method: string, url: string, async?: boolean, user?: string | null, password?: string | null) {
    this._method = method;
    this._url = url;
    this._requestHeaders = {};
    this._startTime = Date.now();
    
    return originalXHROpen.call(this, method, url, async, user, password);
  };

  XMLHttpRequest.prototype.send = function(data?: any) {
    this._data = data;
    
    this.addEventListener('readystatechange', function() {
      if (this.readyState === 4) {
        const endTime = Date.now();
        const duration = endTime - (this._startTime || 0);
        
        console.group(`🌐 ${this._method} ${this._url}`);
        console.log('📤 Request Headers:', this._requestHeaders);
        console.log('📤 Request Data:', this._data);
        console.log('📥 Response Status:', this.status);
        console.log('📥 Response Headers:', this.getAllResponseHeaders());
        console.log('📥 Response Data:', this.responseText);
        console.log('⏱️ Duration:', duration + 'ms');
        console.groupEnd();
      }
    });
    
    return originalXHRSend.call(this, data);
  };

  // Fetch interceptor
  const originalFetch = (global as any)?.fetch;
  const fetchInterceptor = function(url: string | Request, options: RequestInit = {}) {
    const startTime = Date.now();
    
    console.group(`🌐 FETCH ${options.method || 'GET'} ${url}`);
    console.log('📤 Request Options:', options);
    
    return originalFetch(url, options)
      .then((response: Response) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Clone response to read it without consuming it
        const clonedResponse = response.clone();
        
        clonedResponse.text().then((text: string) => {
          console.log('📥 Response Status:', response.status);
          console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
          console.log('📥 Response Data:', text);
          console.log('⏱️ Duration:', duration + 'ms');
          console.groupEnd();
        });
        
        return response;
      })
      .catch((error: any) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('❌ Error:', error);
        console.log('⏱️ Duration:', duration + 'ms');
        console.groupEnd();
        throw error;
      });
  };
  
  if (typeof global !== 'undefined' && global.fetch) {
    global.fetch = fetchInterceptor;
  }
}

export {};
