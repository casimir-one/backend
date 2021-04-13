FROM node:14

# Create app directory
WORKDIR /usr/src/app

RUN mkdir files

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY .npmrc ./

RUN npm install
RUN npm run build

# Bundle app source
COPY . .

EXPOSE 80

CMD [ "npm", "run", "serve" ]
