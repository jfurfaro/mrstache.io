FROM node:5.8-slim

RUN mkdir -p /mrstache.io/client
WORKDIR /mrstache.io
COPY package.json package.json
RUN npm install --production
COPY server/ server
COPY client/dist/ client/dist

EXPOSE 4000
CMD ["npm", "start"]
