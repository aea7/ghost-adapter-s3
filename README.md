# Ghost (ghost.org) adapter for S3

An AWS S3 storage adapter for Ghost 3.2.0 and above

## Installation

```shell
yarn add ghost-adapter-s3
mkdir -p ./content/adapters/storage
cp -r ./node_modules/ghost-adapter-s3 ./content/adapters/storage
```

## Configuration

```json
"storage": {
  "active": "ghost-adapter-s3",
  "ghost-s3-adapter": {
    "accessKeyId": "ACCESS_KEY_ID",
    "secretAccessKey": "SECRET_ACCESS_KEY",
    "bucket": "BUCKET_NAME",
    "pathPrefix": "OPTIONAL_BUCKET_SUBDIRECTORY",
    "acl": "OPTIONAL_ACL (defaults to public-read)"
  }
}
```

## AWS / S3 Actions (Terraform .tf file)

```
actions = [
    "s3:PutObject",
    "s3:PutObjectAcl",
    "s3:PutObjectVersionAcl",
    "s3:GetObject",
    "s3:GetObjectAcl",
    "s3:ListBucket",
    "s3:DeleteObject",
]
```
