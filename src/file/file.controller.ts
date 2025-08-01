import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'stream';
import { Response } from 'express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const readableStream = Readable.from(file.buffer);
    const { stream, fileId } = this.fileService.uploadStream(file.originalname);
    readableStream.pipe(stream);
    return new Promise((resolve, reject) => {
      stream.on('finish', () => { resolve({ fileId, filename: file.originalname }) });
      stream.on('error', (err) => { reject(err) });
    });
  }

  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { stream, filename } = await this.fileService.downloadStream(id);
    res.set({ 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${filename}"` });
    return new Promise<void>((resolve, reject) => {
      stream.on('end', () => { resolve() });
      stream.on('error', (err) => { res.status(404).json({ message: 'File not found' }); reject(err) });
      stream.pipe(res);
    });
  }
}
