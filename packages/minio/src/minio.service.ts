import { Injectable } from '@nestjs/common';
import { Client, Policy } from 'minio';
import { InjectMinio } from './minio.decorator';
@Injectable()
export class MinioService {
  constructor(@InjectMinio() private readonly client: Client) {}
  public get minio(): Client {
    return this.client;
  }
  public createPolicy(bucketName: string) {
    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetBucketLocation'],
          Resource: ['arn:aws:s3:::image'],
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:ListBucket'],
          Resource: [`arn:aws:s3:::${bucketName}`],
          Condition: { StringEquals: { 's3:prefix': ['*'] } },
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/**`],
        },
      ],
    };
  }
  public async createBucket(bucketName: string): Promise<void> {
    const isBucket = await this.client.bucketExists(bucketName);
    if (!isBucket) {
      await this.client.makeBucket(bucketName, 'us-east-1');
      await this.client.setBucketPolicy(
        bucketName,
        JSON.stringify(this.createPolicy(bucketName)),
      );
    }
  }
}
