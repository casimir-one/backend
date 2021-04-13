FROM node:14

# Create app directory
WORKDIR /usr/src/app

RUN mkdir files

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY .npmrc ./

RUN npm install

# Bundle app source
COPY . .

RUN npm run build
EXPOSE 80

CMD [ "npm", "run", "serve" ]
