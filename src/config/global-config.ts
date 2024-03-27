import dotenv from 'dotenv';

export class GlobalConfig {
  private _mode: string;
  private _port: number;
  private _allowedCORSOrigins: string[] | '*';
  private _secretKey: string;

  constructor() {
    dotenv.config();
    
    this._mode = process.env.NODE_ENV ?? 'development';
    this._port = Number(process.env.PORT);
    this._allowedCORSOrigins = process.env.ALLOWED_CORS_ORIGINS?.split(',') ?? '*';
    
    this._secretKey = process.env.KEY_GEN_AI || '';
  }

  mode() {
    return this._mode;
  }

  port(): number {
    return this._port;
  }

  allowedCORSOrigins(): string[] | '*' {
    return this._allowedCORSOrigins;
  }

  get keyAccess(): string {
    return this._secretKey;
  }
}

const globalConfig = new GlobalConfig();

export default globalConfig;