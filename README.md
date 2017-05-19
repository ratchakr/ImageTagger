## ImageTagger
This application lets users upload images of their choice and uses amazon AI to detect labels of the image.

### Tech Stack Used
- Node js and Express
- AWS S3 to store images
- The app uses [Amazon Rekognition API](https://aws.amazon.com/rekognition/) to detect tags on an uploaded image

### Demo
For a demo of the app visit [this link](https://vimeo.com/218099240)

### Steps to run

1. Follow the blog post to run the app locally and using docker
    1.[part1](https://docs.google.com/document/d/1nEnvs3dtn5njKPd5GlBOWjxfduV4Vwuh0AdIrRDZrGM/edit?usp=sharing)
    2.[part2](https://docs.google.com/document/d/1A1rsmNo4YKKpA9cB9Qy3azztWTriTNm3szqVzRDftMg/edit?usp=sharing)
    3.[part3](https://docs.google.com/document/d/18u_NeoQyhS2VHg5tzt-SdauhxFU6TF-SOahTGJXyh5s/edit?usp=sharing)
    4.[part4](https://docs.google.com/document/d/1Nxxwiz9iEjFBN-BpAjh2szdHJ-VNpN_X6WOfOIRJ7KU/edit?usp=sharing)

### TODO-s
- Deploy on aws ec2 (possibly switch ec2 with lambda later)
- Plug into a CI/CD pipeline with Jenkins

