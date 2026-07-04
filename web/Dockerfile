FROM node:22-alpine
WORKDIR /folderhost-client
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "dev"]
EXPOSE 5173