require('dotenv').config();

const crypto = require('crypto');
const {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const sourceBucket = process.env.SUPABASE_STORAGE_BUCKET || 'lunas-storage';
const destinationBucket = process.env.S3_EVIDENCE_BUCKET;
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const applyChanges = process.argv.includes('--apply')
  || process.env.S3_MIGRATION_APPLY === 'true';
const overwrite = process.env.S3_MIGRATION_OVERWRITE === 'true';
const prefix = process.env.S3_MIGRATION_PREFIX || '';
const maxObjects = Number.parseInt(process.env.S3_MIGRATION_MAX_OBJECTS || '0', 10) || 0;

const requireValue = (name, value) => {
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const sourceClient = () => {
  requireValue('SUPABASE_URL', process.env.SUPABASE_URL);
  requireValue('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

const destinationClient = () => new S3Client({
  region: requireValue('AWS_REGION', region),
  ...(process.env.S3_ENDPOINT
    ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
    : {})
});

const listSupabaseObjects = async (client, folder = '') => {
  const objects = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client.storage.from(sourceBucket).list(folder, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error) throw new Error(`Could not list Supabase folder ${folder || '/'}: ${error.message}`);

    const entries = data || [];
    for (const entry of entries) {
      const key = folder ? `${folder}/${entry.name}` : entry.name;
      const isFolder = entry.id === null || entry.metadata === null;
      if (isFolder) {
        objects.push(...await listSupabaseObjects(client, key));
      } else if (!prefix || key.startsWith(prefix)) {
        objects.push({
          key,
          contentType: entry.metadata?.mimetype
            || entry.metadata?.contentType
            || 'application/octet-stream'
        });
      }
    }

    hasMore = entries.length === limit;
    if (hasMore) offset += limit;
  }

  return objects;
};

const downloadSupabaseObject = async (client, key) => {
  const { data, error } = await client.storage.from(sourceBucket).download(key);
  if (error) throw new Error(`Could not download ${key} from Supabase: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
};

const getExistingHash = async (client, key) => {
  try {
    const response = await client.send(new HeadObjectCommand({
      Bucket: destinationBucket,
      Key: key
    }));
    return response.Metadata?.sha256 || null;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') return null;
    throw error;
  }
};

const copyObject = async (source, destination, object) => {
  const { key, contentType } = object;
  const buffer = await downloadSupabaseObject(source, key);
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const existingHash = await getExistingHash(destination, key);

  if (existingHash === sha256) return { key, status: 'verified', sha256 };
  if (existingHash && !overwrite) {
    throw new Error(`Destination object ${key} exists with a different checksum; set S3_MIGRATION_OVERWRITE=true to replace it`);
  }

  if (!applyChanges) {
    return { key, status: existingHash ? 'would_overwrite' : 'would_copy', sha256 };
  }

  await destination.send(new PutObjectCommand({
    Bucket: destinationBucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'private, no-store',
    ServerSideEncryption: process.env.S3_SERVER_SIDE_ENCRYPTION || 'AES256',
    Metadata: { sha256 }
  }));

  const verifiedHash = await getExistingHash(destination, key);
  if (verifiedHash !== sha256) {
    throw new Error(`Checksum verification failed after copying ${key}`);
  }
  return { key, status: existingHash ? 'overwritten' : 'copied', sha256 };
};

const main = async () => {
  requireValue('S3_EVIDENCE_BUCKET', destinationBucket);
  const source = sourceClient();
  const destination = destinationClient();
  const keys = await listSupabaseObjects(source, '');
  const selectedKeys = maxObjects ? keys.slice(0, maxObjects) : keys;

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    sourceBucket,
    destinationBucket,
    objectCount: selectedKeys.length,
    prefix: prefix || null
  }));

  const results = [];
  for (const key of selectedKeys) {
    const result = await copyObject(source, destination, key);
    results.push(result);
    console.log(JSON.stringify(result));
  }

  const summary = results.reduce((counts, result) => {
    counts[result.status] = (counts[result.status] || 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({ complete: true, summary }));
};

main().catch((error) => {
  console.error(`Storage migration failed: ${error.message}`);
  process.exitCode = 1;
});
