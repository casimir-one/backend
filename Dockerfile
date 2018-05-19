FROM node:carbon

# this is for private @deip npm registry
ARG NPM_TOKEN=30100a2f-a641-48a6-ac61-ea3e8f596baf
COPY .npmrc .npmrc  

# Create app directory
WORKDIR /usr/src/app

RUN mkdir files

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 80
CMD [ "npm", "run", "server" ]