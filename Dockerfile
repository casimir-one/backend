FROM node:14

# Create app directory
WORKDIR /usr/src/app

RUN mkdir files

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY .npmrc ./

RUN npm install
RUN npm build

# Bundle app source
COPY ./node_modules .
COPY ./dist .

EXPOSE 80

CMD [ "npm", "run", "serve" ]
