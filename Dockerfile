
# /Dockerfile

FROM node:20-alpine

WORKDIR /app

COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install

WORKDIR /app/apps/api
RUN pnpm run build  # optional: only if you create a build script later

ENV PORT=4000
EXPOSE 4000

CMD ["pnpm", "dev"]

