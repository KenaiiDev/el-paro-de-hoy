declare module 'google-news-url-decoder' {
  export class GoogleDecoder {
    decode(url: string): Promise<{ status: boolean; decoded_url?: string }>;
  }
}
