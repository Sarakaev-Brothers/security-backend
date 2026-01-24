import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfig {
  readonly JWT_SECRET: string;
  readonly JWT_ACCESS_EXPIRES_IN: number;
  readonly JWT_REFRESH_EXPIRES_IN_DAYS: number;
  readonly JWT_REFRESH_SECRET: string;
  readonly DATABASE_URL: string;

  constructor(@Inject(ConfigService) private config: ConfigService) {
    this.JWT_SECRET = this.required('JWT_SECRET');
    this.JWT_ACCESS_EXPIRES_IN = this.requiredNumber(
      'JWT_ACCESS_EXPIRES_IN_MINUTES',
    );
    this.JWT_REFRESH_EXPIRES_IN_DAYS = this.requiredNumber(
      'JWT_REFRESH_EXPIRES_IN_DAYS',
    );
    this.JWT_REFRESH_SECRET =
      this.optional('JWT_REFRESH_SECRET') || this.JWT_SECRET;
    this.DATABASE_URL = this.required('DATABASE_URL');
  }

  private required(key: string): string {
    const val = this.config.get<string>(key);
    if (!val) throw new Error(`${key} is not set`);
    return val;
  }

  private optional(key: string): string | undefined {
    return this.config.get<string>(key);
  }

  private requiredNumber(key: string): number {
    const val = this.config.get<string>(key);
    if (!val) throw new Error(`${key} is not set`);
    const num = Number(val);
    if (!Number.isFinite(num)) throw new Error(`${key} must be a number`);
    return num;
  }
}
