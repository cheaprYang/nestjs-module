import { Provider } from '@nestjs/common';
import { ClientOptions, Client } from 'minio';
import { MINIO_CONNECTION, NEST_MINIO_OPTIONS } from './minio.constants';
export const createClient = (): Provider => ({
  provide: MINIO_CONNECTION,
  useFactory: async (options: ClientOptions): Promise<Client> => {
    return new Client(options);
  },
  inject: [NEST_MINIO_OPTIONS],
});
