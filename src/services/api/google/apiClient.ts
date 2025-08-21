import { GoogleVisionRequest, GoogleVisionResponse } from './types';

export const googleApiClient = {
  async callVisionAPI(request: GoogleVisionRequest, apiKey: string): Promise<GoogleVisionResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }
};