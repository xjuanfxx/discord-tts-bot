# @discordjs/voice requires Node.js 22.12 or newer.
FROM node:22-alpine

ARG DATE_CREATED
ARG VERSION

LABEL org.opencontainers.image.created=$DATE_CREATED
LABEL org.opencontainers.image.version=$VERSION
LABEL org.opencontainers.image.authors="moonstar-x"
LABEL org.opencontainers.image.vendor="moonstar-x"
LABEL org.opencontainers.image.title="Discord TTS Bot"
LABEL org.opencontainers.image.description="A Text-to-Speech bot for Discord."
LABEL org.opencontainers.image.source="https://github.com/moonstar-x/discord-tts-bot"

RUN apk add --no-cache ffmpeg python3 make gcc g++ zlib zlib-dev

WORKDIR /opt/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

CMD ["npm", "start"]
