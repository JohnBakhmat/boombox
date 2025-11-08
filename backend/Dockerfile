FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY ./backend/package.json /temp/dev/backend/
COPY ./shared/package.json /temp/dev/shared/
COPY ./web/package.json /temp/dev/web/

RUN cd /temp/dev && bun install --frozen-lockfile
# Prod deps
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
COPY ./backend/package.json /temp/prod/backend/
COPY ./shared/package.json /temp/prod/shared/
COPY ./web/package.json /temp/prod/web/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
ENV NODE_ENV=production
WORKDIR /app/backend
RUN bun run build
WORKDIR /app

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/backend/dist .
# Copy migration files (SQL schemas)
COPY --from=prerelease /app/backend/drizzle ./drizzle

# Create directories for volumes with proper ownership
RUN mkdir -p /app/data /app/music && \
    chown -R bun:bun /app/data /app/music

# Declare volumes
VOLUME ["/app/data", "/app/music"]

USER bun
EXPOSE 3003/tcp

# Set default environment variables
ENV DB_URL=/app/data/boombox.db
ENV FOLDER_PATH=/app/music

ENTRYPOINT [ "bun", "index.js" ]
