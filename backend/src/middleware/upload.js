import multer from 'multer';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config/index.js';

/**
 * Images are buffered in memory by multer, then streamed to S3 so they persist
 * outside the API server. `uploadImage` returns a public URL which is stored on
 * the property document.
 */

const storage = multer.memoryStorage();
const s3 = new S3Client({
  region: config.awsRegion,
  credentials:
    config.awsAccessKeyId && config.awsSecretAccessKey
      ? {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        }
      : undefined,
});

const fileFilter = (_req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
});

export async function uploadImage(file) {
  if (!config.awsS3Bucket) {
    throw new Error('AWS_S3_BUCKET is not configured');
  }

  const ext = (file.originalname.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase();
  const key = `properties/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const base =
    config.awsS3PublicBaseUrl ||
    `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com`;
  return `${base.replace(/\/$/, '')}/${key}`;
}
