## ImageTagger
This application lets users upload images of their choice and uses amazon AI to detect labels of the image.

### Tech Stack Used
- Node js and Express
- AWS S3 to store images
- The app uses [Amazon Rekognition API](https://aws.amazon.com/rekognition/) to detect tags on an uploaded image


### TODO-s
- Add features with more aws rekognition API-s
- Integrate Couchbase node sdk to build the tagging feature of photos
- Dockerize the app
- Deploy on aws ec2 (possibly switch ec2 with lambda later)
- Plug into a CI/CD pipeline with Jenkins

