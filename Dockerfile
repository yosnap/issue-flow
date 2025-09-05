# Multi-stage build for IssueFlow Core Service
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY packages/sdk/package*.json ./packages/sdk/

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/sdk/node_modules ./packages/sdk/node_modules

# Copy source code
COPY . .

# Build the core service
RUN npm run build:core
RUN npm run build:sdk

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Create app user
RUN addgroup --system --gid 1001 issueflow
RUN adduser --system --uid 1001 issueflow

# Copy built application
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/core/package*.json ./packages/core/
COPY --from=builder /app/packages/sdk/package*.json ./packages/sdk/

# Copy production dependencies
COPY --from=deps --chown=issueflow:issueflow /app/node_modules ./node_modules
COPY --from=deps --chown=issueflow:issueflow /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps --chown=issueflow:issueflow /app/packages/sdk/node_modules ./packages/sdk/node_modules

# Set user
USER issueflow

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "packages/core/dist/index.js"]