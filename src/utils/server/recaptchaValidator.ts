import { logger } from './logger';

interface RecaptchaValidationResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
  score?: number;
}

export class RecaptchaValidator {
  private secretKey: string;
  private scoreThreshold?: number;

  constructor(secretKey: string, scoreThreshold?: number) {
    this.secretKey = secretKey;
    this.scoreThreshold = scoreThreshold;
  }

  async validateToken(token: string): Promise<boolean> {
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${this.secretKey}&response=${token}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RecaptchaValidationResponse = await response.json();

      logger.debug(data, 'reCAPTCHA Verification Response');

      if (data.score && this.scoreThreshold) {
        return data.score >= this.scoreThreshold;
      }

      return data.success;
    } catch (error) {
      logger.error(error, 'Error during reCAPTCHA validation');
      return false;
    }
  }
}
