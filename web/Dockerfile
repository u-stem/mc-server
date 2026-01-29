# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies (workspace structure)
# --ignore-scripts: lefthook install is dev-only and requires git
COPY package.json bun.lock ./
COPY web/package.json ./web/
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source code
COPY web/ ./web/

# Build the application (run from root to use hoisted node_modules)
RUN bun run --cwd web build

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install docker CLI with compose plugin
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y docker-ce-cli docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# Copy built application (workspace structure: standalone outputs to web/ subdirectory)
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY --from=builder /app/web/public ./web/public

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs && \
    chown -R nextjs:nodejs /app

# Note: docker group access is handled by docker.sock mount permissions
USER nextjs

WORKDIR /app/web

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
