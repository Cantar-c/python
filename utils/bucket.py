import os

import boto3
from botocore.client import Config

S3_BUCKET = os.getenv("S3_BUCKET", "baiyuntube")
S3_REGION = os.getenv("S3_REGION", "undefined")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "https://undefined.cool")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY", "55bgtrBOSdEnpCC81EgR")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY", "hQgYV1UH6IrTVubuC2KNF1jvMaNm9P4KWecc5vaC")

# 创建 S3 客户端
s3 = boto3.client(
    "s3",
    region_name=S3_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    endpoint_url=S3_ENDPOINT,
    config=Config(s3={"addressing_style": "path"})
)

if __name__ == '__main__':
    # 上传文件
    print(s3.put_object(Bucket=S3_BUCKET, Key='local_file.txt', Body=open('local_file.txt', 'rb')))
