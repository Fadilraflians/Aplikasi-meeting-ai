// Gemini API Configuration and Management
export interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxRetries: number;
  retryDelay: number;
  quotaExceededMessage: string;
}

export class GeminiConfigManager {
  private static instance: GeminiConfigManager;
  private config: GeminiConfig;

  private constructor() {
    this.config = {
      apiKey: this.getApiKey(),
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      model: 'gemini-pro-latest:generateContent',
      maxRetries: 2,
      retryDelay: 5000,
      quotaExceededMessage: 'Maaf, kuota Gemini API telah habis. Sistem akan menggunakan mode fallback yang tetap dapat membantu Anda.'
    };
  }

  public static getInstance(): GeminiConfigManager {
    if (!GeminiConfigManager.instance) {
      GeminiConfigManager.instance = new GeminiConfigManager();
    }
    return GeminiConfigManager.instance;
  }

  private getApiKey(): string {
    // Try multiple sources for API key
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const processKey = (process as any).env?.GEMINI_API_KEY;
    const fallbackKey = 'AIzaSyCayP_SbTbuR_9U-74icPTeiVULXLzLyko';
    
    const apiKey = envKey || processKey || fallbackKey;
    
    console.log('🔑 Gemini API Key Status:', {
      envKey: envKey ? 'Found' : 'Not found',
      processKey: processKey ? 'Found' : 'Not found',
      fallbackKey: fallbackKey ? 'Available' : 'Not available',
      finalKey: apiKey ? 'Set' : 'Empty'
    });
    
    return apiKey;
  }

  public getConfig(): GeminiConfig {
    return this.config;
  }

  public updateApiKey(newApiKey: string): void {
    this.config.apiKey = newApiKey;
    console.log('🔑 Gemini API Key updated');
  }

  public isApiKeyValid(): boolean {
    return this.config.apiKey && this.config.apiKey.length > 0;
  }

  public getQuotaExceededMessage(): string {
    return this.config.quotaExceededMessage;
  }

  public getFullApiUrl(): string {
    return `${this.config.baseUrl}/${this.config.model}`;
  }
}

// Export singleton instance
export const geminiConfig = GeminiConfigManager.getInstance();
