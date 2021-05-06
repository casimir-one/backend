FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY .npmrc ./

RUN npm install

# Bundle app source
COPY . .
RUN mkdir files && mkdir logs

RUN npm run build
EXPOSE 80

CMD [ "npm", "run", "serve" ]
