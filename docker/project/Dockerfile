FROM node:21

RUN npm install --location=global npm@10.5.1
RUN rm -rf /root/.npm/_cacache/tmp

WORKDIR /project

CMD npm start