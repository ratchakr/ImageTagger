FROM node:latest

COPY . /srv/
WORKDIR /srv

RUN /usr/local/bin/npm install

CMD /usr/local/bin/node upload.js