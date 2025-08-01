import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient, GridFSBucket, Db } from 'mongodb';
import { Writable, Readable } from 'stream';
import { ObjectId } from 'mongodb';

@Injectable()
export class FileService implements OnModuleInit {
  private bucket: GridFSBucket;
  private db: Db;

  async onModuleInit() {
    const client = new MongoClient('mongodb://localhost:27017/nest_crud');
    await client.connect();
    this.db = client.db('nest_crud');
    this.bucket = new GridFSBucket(this.db, { bucketName: 'uploads' });
  }

  uploadStream(filename: string): { stream: Writable; fileId: string } {
    const uploadStream = this.bucket.openUploadStream(filename);
    return { stream: uploadStream, fileId: uploadStream.id.toString() };
  }

  async downloadStream(fileId: string): Promise<{ stream: Readable; filename: string }> {
    const _id = new ObjectId(fileId);
    const fileDoc = await this.db.collection('uploads.files').findOne({ _id });
    if (!fileDoc) {
      throw new Error('File not found');
    }
    const stream = this.bucket.openDownloadStream(_id);
    return {
      stream,
      filename: fileDoc.filename as string,
    };
  }
}
