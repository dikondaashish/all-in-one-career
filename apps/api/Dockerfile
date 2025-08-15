
# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files for the entire monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm and dependencies for the entire monorepo
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copy the entire project structure
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate --schema=../../prisma/schema.prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Start the API application using tsx (no build required)
CMD ["pnpm", "start"]

