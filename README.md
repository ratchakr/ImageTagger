## ImageTagger
This application lets users upload images of their choice and uses amazon AI to detect labels of the image.

### Tech Stack Used
- Node js and Express
- AWS S3 to store images
- The app uses [Amazon Rekognition API](https://aws.amazon.com/rekognition/) to detect tags on an uploaded image
- Added image moderation and celebrity recognition features of aws rekognition AI to the app. The app won't let users upload any
  image with offensive contents. It will also recognize if a photo of a celebrity is uploaded.
- Couchbase to store metadata information of the images

### Demo
- For a demo of the app visit [this link](https://vimeo.com/218099240).
- For a demo of the updated app with additional image recognition features can be seen [here](https://vimeo.com/222643872).

### Steps to run the app locally and using docker
- [Part 1](https://docs.google.com/document/d/1nEnvs3dtn5njKPd5GlBOWjxfduV4Vwuh0AdIrRDZrGM/edit?usp=sharing)
- [Part 2](https://docs.google.com/document/d/1A1rsmNo4YKKpA9cB9Qy3azztWTriTNm3szqVzRDftMg/edit?usp=sharing)
- [Part 3](https://docs.google.com/document/d/18u_NeoQyhS2VHg5tzt-SdauhxFU6TF-SOahTGJXyh5s/edit?usp=sharing)
- [Part 4](https://docs.google.com/document/d/1Nxxwiz9iEjFBN-BpAjh2szdHJ-VNpN_X6WOfOIRJ7KU/edit?usp=sharing)

### TODO-s
- Currently the app runs on aws ec2 (would switch ec2 with lambda as next step)
- Plug into a CI/CD pipeline with Jenkins

