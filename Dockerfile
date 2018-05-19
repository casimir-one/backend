FROM node:carbon

ARG NPM_TOKEN
# Create app directory
WORKDIR /usr/src/app

RUN mkdir files

# this is for private @deip npm registry
COPY .npmrc .npmrc  

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 80
CMD [ "npm", "run", "server" ]