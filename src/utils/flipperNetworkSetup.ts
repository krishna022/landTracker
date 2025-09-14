import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Extend the config interface to include our custom metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      requestId: string;
      timestamp: number;
    };
  }
}

// Enhanced console logging for network requests
export const setupConsoleNetworkLogger = () => {
  if (__DEV__) {
    let requestId = 0;
    const pendingRequests = new Map<string, { timestamp: number; config: InternalAxiosRequestConfig }>();

    console.log('🔧 Setting up network monitoring...');

    // Request interceptor for console logging
    axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const id = `req_${++requestId}`;
        const timestamp = Date.now();
        
        pendingRequests.set(id, { timestamp, config });
        
        console.group(`🚀 HTTP Request #${requestId}`);
        console.log(`Method: ${config.method?.toUpperCase()}`);
        console.log(`URL: ${config.baseURL}${config.url}`);
        console.log('Headers:', JSON.stringify(config.headers, null, 2));
        if (config.data) {
          console.log('Request Data:', JSON.stringify(config.data, null, 2));
        }
        console.log(`Timestamp: ${new Date(timestamp).toISOString()}`);
        console.groupEnd();

        // Store request ID for response tracking
        config.metadata = { requestId: id, timestamp };
        return config;
      },
      (error: AxiosError) => {
        console.error('❌ Request Setup Error:', error.message);
        console.error('Error details:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for console logging
    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestId = response.config.metadata?.requestId;
        if (requestId && pendingRequests.has(requestId)) {
          const { timestamp } = pendingRequests.get(requestId)!;
          const duration = Date.now() - timestamp;
          pendingRequests.delete(requestId);

          console.group(`✅ HTTP Response #${requestId.split('_')[1]} (${duration}ms)`);
          console.log(`Status: ${response.status} ${response.statusText}`);
          console.log(`URL: ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url}`);
          console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
          console.log('Response Data:', JSON.stringify(response.data, null, 2));
          console.log(`Duration: ${duration}ms`);
          console.log(`Completed at: ${new Date().toISOString()}`);
          console.groupEnd();
        }

        return response;
      },
      (error: AxiosError) => {
        const requestId = error.config?.metadata?.requestId;
        if (requestId && pendingRequests.has(requestId)) {
          const { timestamp } = pendingRequests.get(requestId)!;
          const duration = Date.now() - timestamp;
          pendingRequests.delete(requestId);

          console.group(`❌ HTTP Error #${requestId.split('_')[1]} (${duration}ms)`);
          console.log(`Status: ${error.response?.status || 'Network Error'}`);
          console.log(`URL: ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}`);
          console.log('Error Message:', error.message);
          if (error.response?.headers) {
            console.log('Error Headers:', JSON.stringify(error.response.headers, null, 2));
          }
          if (error.response?.data) {
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
          }
          console.log(`Duration: ${duration}ms`);
          console.log(`Failed at: ${new Date().toISOString()}`);
          console.groupEnd();
        }

        return Promise.reject(error);
      }
    );

    console.log('✅ Console network logger setup complete - Check console for network requests');
  }
};

// Network monitor that works in React Native environment
export const setupNetworkMonitor = () => {
  if (__DEV__) {
    console.log('🔍 Starting network monitoring setup...');
    setupConsoleNetworkLogger();
    
    // Log XMLHttpRequest activity (used by axios under the hood)
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string, async?: boolean, user?: string | null, password?: string | null) {
      (this as any)._method = method;
      (this as any)._url = url;
      console.log(`🌐 XHR Opening: ${method} ${url}`);
      return originalXHROpen.call(this, method, url, async, user, password);
    };

    XMLHttpRequest.prototype.send = function(data?: any) {
      console.log(`🌐 XHR Sending: ${(this as any)._method} ${(this as any)._url}`, data ? JSON.stringify(data) : 'No data');
      
      const originalOnReadyStateChange = this.onreadystatechange;
      this.onreadystatechange = (event: Event) => {
        if (this.readyState === 4) {
          console.log(`🌐 XHR Response: ${this.status} ${this.statusText} for ${(this as any)._method} ${(this as any)._url}`);
          if (this.responseText) {
            try {
              const responseData = JSON.parse(this.responseText);
              console.log('🌐 XHR Response Data:', responseData);
            } catch (e) {
              console.log('🌐 XHR Response Text:', this.responseText);
            }
          }
        }
        
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(this, event);
        }
      };
      
      return originalXHRSend.call(this, data);
    };

    console.log('✅ Network monitoring setup complete!');
    console.log('📱 To see network requests:');
    console.log('   1. Open React Native Debugger or Chrome DevTools');
    console.log('   2. Enable "Debug JS Remotely" in the app dev menu (Cmd+M)');
    console.log('   3. All network requests will appear in the console');
  }
};
