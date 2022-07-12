import { Module, DynamicModule } from '@nestjs/common';
import { MinioService } from './minio.service';
import { NEST_MINIO_OPTIONS } from './minio.constants';
import { ClientOptions } from 'minio';
import { createClient } from './minio.provider';
import { ModuleMetadata } from '@nestjs/common/interfaces';
export interface MinioModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useFactory?: (...args: any[]) => ClientOptions | Promise<ClientOptions>;
  inject?: any[];
}
export interface MinioModuleOptions extends ClientOptions {
  isGlobal?: boolean;
}
@Module({
  providers: [MinioService],
})
export  class MinioModule {
  public static forRoot(options: MinioModuleOptions): DynamicModule {
    const provider = createClient();
    return {
      module: MinioModule,
      global: options.isGlobal || false,
      providers: [
        provider,
        {
          provide: NEST_MINIO_OPTIONS,
          useValue: options,
        },
      ],
      exports: [provider, MinioService],
    };
  }
  public static forRootAsync(options: MinioModuleAsyncOptions): DynamicModule {
    const provider = createClient();
    return {
      module: MinioModule,
      global: options.isGlobal,
      providers: [
        provider,
        {
          provide: NEST_MINIO_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
      ],
      imports: options.imports || [],
      exports: [provider, MinioService],
    };
  }
}
