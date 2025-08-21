# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy monorepo root package-manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm v9 (stable, reduces approve-builds warnings) and install all workspace deps
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate && pnpm config set ignore-script false
RUN pnpm install --frozen-lockfile

# Copy the entire monorepo into the container
COPY . .

# Generate Prisma client for production
RUN npx prisma generate --schema=prisma/schema.prisma

# Move into the API workdir and install tsx as production dependency
WORKDIR /app/apps/api
RUN pnpm add tsx

# Env config
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Start the API using tsx
CMD ["pnpm", "start"]
