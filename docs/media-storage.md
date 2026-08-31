# Media Storage

Development defaults to `MEDIA_STORAGE=local`; optimized files are written under ignored `apps/api/uploads/` and served from `/media`.

For production, create a Cloudflare R2 bucket and an object read/write API token scoped to that bucket. Connect the bucket to a custom domain for public delivery, then configure:

```env
MEDIA_STORAGE="r2"
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="term-academy-media"
MEDIA_PUBLIC_URL="https://media.example.com"
IMAGE_HOSTS="images.unsplash.com,media.example.com"
```

Add the same delivery hostname to the frontend:

```env
NEXT_PUBLIC_IMAGE_HOSTS="images.unsplash.com,media.example.com"
```

The backend uses Cloudflare's S3-compatible endpoint with region `auto`. Keep credentials server-side and never add them to frontend variables. The admin upload endpoint accepts one JPEG, PNG, WebP, or AVIF file up to 10 MB, normalizes orientation, optionally crops to the requested dimensions, and stores an optimized WebP.

References: [R2 S3 API](https://developers.cloudflare.com/r2/api/s3/api/) and [public buckets/custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/).
