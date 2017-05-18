#!/bin/bash
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

sudo yum install git-all -y

mkdir /home/ec2-user/photogallery

cd /home/ec2-user/photogallery

git clone https://github.com/ratchakr/ImageTagger.git

cd ImageTagger/

git checkout staging

exit

