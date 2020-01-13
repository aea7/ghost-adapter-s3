const AWS = require('aws-sdk')
const BaseStore = require('ghost-storage-base')
const join = require('path').join
const readFile = require('fs').readFile

const readFileAsync = fp => new Promise((resolve, reject) => readFile(fp, (err, data) => err ? reject(err) : resolve(data)))
const stripLeadingSlash = s => s.indexOf('/') === 0 ? s.substring(1) : s
const stripEndingSlash = s => s.indexOf('/') === (s.length - 1) ? s.substring(0, s.length - 1) : s

class Store extends BaseStore {
    constructor(config = {}) {
        super(config)

        const {
            accessKeyId,
            bucket,
            pathPrefix,
            secretAccessKey,
            acl
        } = config

        this.accessKeyId = accessKeyId
        this.secretAccessKey = secretAccessKey
        this.bucket = bucket
        this.pathPrefix = '' || pathPrefix
        this.acl = 'public-read' || acl

        this.s3 = new AWS.S3({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        });
    }

    delete(fileName, targetDir) {
        const directory = targetDir || this.getTargetDir(this.pathPrefix)

        return new Promise((resolve) => {
            this.s3.deleteObject({
                Bucket: this.bucket,
                Key: stripLeadingSlash(join(directory, fileName))
            }, (err) => err ? resolve(false) : resolve(true))
        })
    }

    exists(fileName, targetDir) {
        return new Promise((resolve) => {
            this.s3.getObject({
                    Bucket: this.bucket,
                    Key: stripLeadingSlash(join(targetDir, fileName))
                }, (err) => err ? resolve(false) : resolve(true))
        })
    }

    save(image, targetDir) {
        const directory = targetDir || this.getTargetDir(this.pathPrefix)
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getUniqueFileName(image, directory),
                readFileAsync(image.path)
            ]).then(([fileName, file]) => {
                let config = {
                    ACL: this.acl,
                    Body: file,
                    Bucket: this.bucket,
                    CacheControl: `max-age=${30 * 24 * 60 * 60}`,
                    ContentType: image.type,
                    Key: stripLeadingSlash(fileName)
                }
                if (this.serverSideEncryption !== '') {
                    config.ServerSideEncryption = this.serverSideEncryption
                }
                this.s3.upload(config, function (err, data) {
                    err ? reject(err) : resolve(`${data.Location}`)
                });
            })
                .catch(err => reject(err))
        })
    }

    serve() {
        return (req, res, next) =>
            this.s3.getObject({
                    Bucket: this.bucket,
                    Key: stripLeadingSlash(stripEndingSlash(this.pathPrefix) + req.path)
                })
                .on('httpHeaders', (statusCode, headers, response) => res.set(headers))
                .createReadStream()
                .on('error', err => {
                    res.status(404)
                    next(err)
                })
                .pipe(res)
    }

    read(options) {
        options = options || {}

        return new Promise((resolve, reject) => {
            let path = (options.path || '').replace(/\/$|\\$/, '')

            if (!path.startsWith(this.host)) {
                reject(new Error(`${path} is not stored in s3`))
            }
            path = path.substring(this.host.length)

            this.s3.getObject({
                    Bucket: this.bucket,
                    Key: stripLeadingSlash(path)
                }, (err, data) => err ? reject(err) : resolve(data.Body))
        })
    }
}

module.exports = Store;
