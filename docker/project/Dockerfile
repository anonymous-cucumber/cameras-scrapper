FROM node:22.9

RUN npm install --location=global npm@11.0.0
RUN rm -rf /root/.npm/_cacache/tmp

WORKDIR /project

CMD npm start