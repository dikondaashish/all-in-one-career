# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy monorepo root package-manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm and install all workspace deps
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm config set ignore-script false
RUN pnpm install --frozen-lockfile

# Copy the entire monorepo into the container
COPY . .

# Move into the API workdir (apps/api)
WORKDIR /app/apps/api

# Install tsx globally for production use
RUN npm install -g tsx

# Generate Prisma client
RUN npx prisma generate --schema=../../prisma/schema.prisma

# Env config
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Start the API using tsx
CMD ["tsx", "src/index.ts"]
