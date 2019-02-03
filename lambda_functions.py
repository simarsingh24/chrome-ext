

import json
import boto3


def utf8len(s):
    return len(s.encode('utf-8'))
    
def truncateUTF8length(unicodeStr, maxsize):
    return str(unicodeStr.encode("utf-8")[:maxsize], "utf-8", errors="ignore")


def lambda_handler(event, context):
    ACCESS_KEY_ID = ''
    ACCESS_SECRET_KEY = ''
    BUCKET_NAME = 'seektube'
    
    s3 = boto3.client("s3",aws_access_key_id=ACCESS_KEY_ID,aws_secret_access_key=ACCESS_SECRET_KEY)
    comprehend  = boto3.client('comprehend',aws_access_key_id=ACCESS_KEY_ID,aws_secret_access_key=ACCESS_SECRET_KEY,region_name='us-east-1')
    json_name=event["queryStringParameters"]['id'] +'.json'
    json_object=s3.get_object(Bucket=BUCKET_NAME,Key= json_name)
    
    json_reader=json_object['Body'].read()
    json_data=json.loads(json_reader)
    final_json=json_data["results"]["items"]
    transcript=json_data["results"]["transcripts"][0]['transcript']
    
    transcript_length = utf8len(transcript);
    
    if (transcript_length > 5000):
        transcript = truncateUTF8length(transcript, 5000)
    
    sentiment = comprehend.detect_sentiment(Text=transcript, LanguageCode='en')
    message = {
        "json": final_json,
        "transcript": transcript,
        "sentiment": sentiment
    }
    
    
    return {
        'statusCode': 200,
        'body': json.dumps({"status":message}),
         "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        }
    }







//generate_Transcripts





import json
import boto3

BUCKET = 'seektube'

def lambda_handler(event, context):
    ACCESS_KEY_ID = ''
    ACCESS_SECRET_KEY = ''
    
    transcribe = boto3.client("transcribe",aws_access_key_id=ACCESS_KEY_ID,aws_secret_access_key=ACCESS_SECRET_KEY,
        region_name='us-east-1')
    
    v_name = event["queryStringParameters"]['id']
    
    response = transcribe.start_transcription_job(
        TranscriptionJobName = v_name,
        LanguageCode = "en-US",
        MediaFormat = "mp4",
        Media={
            
            "MediaFileUri": "https://s3.amazonaws.com/" + BUCKET + "/" + v_name + ".mp4"
        },
        OutputBucketName = BUCKET,
    )
    message = {"name": v_name}


  
    return {
        "statusCode": 200,
        "body": json.dumps(message),
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        }
    }



///status check

import json
import boto3

BUCKET = 'seektube'

def lambda_handler(event, context):
    ACCESS_KEY_ID = ''
    ACCESS_SECRET_KEY = ''
    
    transcribe = boto3.client("transcribe",aws_access_key_id=ACCESS_KEY_ID,aws_secret_access_key=ACCESS_SECRET_KEY,
        region_name='us-east-1')
    
    job_name=event["queryStringParameters"]['id']
    
    try:
        response = transcribe.get_transcription_job(TranscriptionJobName = job_name)
        message = response["TranscriptionJob"]["TranscriptionJobStatus"]
    except:
        message='Job Not exsist'

    return {
        "statusCode": 200,
        "body": json.dumps({"status": message}),
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        }
    }








