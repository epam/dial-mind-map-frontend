import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

import { logger } from '../logger';
import { recaptchaServiceClient } from './recaptchaServiceClient';

export class RecaptchaValidator {
  private projectId: string;
  private siteKey: string;
  private client: RecaptchaEnterpriseServiceClient;
  private scoreThreshold?: number;

  constructor(projectId: string, siteKey: string, scoreThreshold?: number) {
    this.projectId = projectId;
    this.siteKey = siteKey;
    this.scoreThreshold = scoreThreshold;

    this.client = recaptchaServiceClient;
  }

  async validateToken(token: string, userIpAddress?: string, userAgent?: string): Promise<boolean> {
    const event = {
      siteKey: this.siteKey,
      token: token,
      userIpAddress: userIpAddress,
      userAgent: userAgent,
    };

    const request = {
      parent: this.client.projectPath(this.projectId),
      assessment: { event },
    };

    try {
      const [response] = await this.client.createAssessment(request);

      const tokenProps = response.tokenProperties;
      if (!tokenProps) {
        logger.error({ response }, 'No tokenProperties in reCAPTCHA assessment response');
        return false;
      }

      if (!tokenProps.valid) {
        logger.warn({ invalidReason: tokenProps.invalidReason }, 'reCAPTCHA token is invalid');
        return false;
      }

      const risk = response.riskAnalysis;
      if (risk && typeof risk.score === 'number') {
        logger.debug({ score: risk.score, reasons: risk.reasons }, 'reCAPTCHA risk score');
        if (this.scoreThreshold !== undefined) {
          return risk.score >= this.scoreThreshold;
        }
        return true;
      }

      return true;
    } catch (err) {
      logger.error(err, 'Error validating reCAPTCHA Enterprise token');
      return false;
    }
  }
}
