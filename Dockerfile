FROM node:10

# Create app directory
WORKDIR /usr/src/app

RUN mkdir files

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY .npmrc ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 80

CMD [ "npm", "run", "server" ]
